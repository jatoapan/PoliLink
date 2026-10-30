<?php

namespace App\Services\Discovery;

use App\Models\Event;
use Illuminate\Support\Str;

/**
 * Cleans keywords coming from Gemma or from the rule-based fallback before
 * they reach the database, and derives the substring used to search them.
 */
class DiscoveryKeywords
{
    public const MIN_LENGTH = 3;

    public const MAX_LENGTH = 40;

    /** Accepts letters, digits, spaces and the symbols used by names such as C++, C# or Node.js. */
    public const PATTERN = '/^[\pL\pN][\pL\pN .+#-]*$/u';

    /**
     * Short acronyms match inside unrelated words ("IA" in "Guayaquil"), so they
     * are expanded before searching.
     */
    private const ACRONYMS = [
        'ia' => 'inteligencia artificial',
        'ai' => 'inteligencia artificial',
        'ml' => 'aprendizaje automático',
    ];

    /** Generic words that would match almost every event (accent-folded). */
    private const STOPWORDS = [
        'actividad', 'actividades', 'evento', 'eventos', 'gente', 'persona', 'personas',
        'comunidad', 'comunidades', 'club', 'clubes', 'grupo', 'grupos', 'espol',
        'estudiante', 'estudiantes', 'universidad', 'cosas', 'algo', 'tema', 'temas',
        'interes', 'intereses', 'conocer', 'aprender', 'participar', 'quiero', 'busco',
        'buscar', 'prefiero', 'interesa', 'gustaria', 'semana', 'dia', 'dias',
    ];

    /** Accent-folded Spanish function words and filler verbs. */
    public const FILLER_WORDS = [
        'a', 'al', 'algo', 'algun', 'alguna', 'algunas', 'algunos', 'asistir', 'busco', 'como', 'con', 'cuando',
        'de', 'del', 'desde', 'donde', 'el', 'ella', 'en', 'entre', 'es', 'esa', 'ese', 'esta', 'estar', 'este',
        'estos', 'estas', 'gusta', 'gustan', 'gustaria', 'hacer', 'hasta', 'hay', 'interesa', 'interesan', 'ir',
        'la', 'las', 'le', 'les', 'lo', 'los', 'mas', 'me', 'mi', 'mis', 'mucho', 'muy', 'nos', 'o', 'otra',
        'otras', 'otro', 'otros', 'para', 'pero', 'por', 'prefiero', 'puedo', 'que', 'quiero', 'quisiera', 'se',
        'sea', 'sean', 'ser', 'sin', 'sobre', 'solo', 'son', 'su', 'sus', 'tambien', 'tengo', 'todo', 'todos',
        'tu', 'tus', 'un', 'una', 'unas', 'unos', 'ver', 'y', 'yo', 'cual', 'cuales', 'quien', 'nuestro',
        'nuestra', 'nuestros', 'nuestras', 'mejorar', 'mejor', 'entender', 'saber', 'tocar', 'salir', 'poder',
        'nuevo', 'nueva', 'nuevos', 'nuevas', 'quizas', 'tal', 'vez',
    ];

    /** Spanish inflection endings, longest first, removed from single words of seven or more letters. */
    private const SUFFIXES = [
        'aciones', 'ación', 'ciones', 'ción', 'iendo', 'ando',
        'es', 'as', 'os', 'ar', 'er', 'ir', 'a', 'e', 'o', 's',
    ];

    private const MIN_STEM_LENGTH = 5;

    /**
     * @param  array<int, string>  $keywords
     * @return array<int, string>
     */
    public function normalize(array $keywords): array
    {
        return collect($keywords)
            ->map(fn (string $keyword) => Str::squish(mb_strtolower($keyword)))
            ->map(fn (string $keyword) => preg_replace_callback(
                '/(?<![\pL\pN])('.implode('|', array_keys(self::ACRONYMS)).')(?![\pL\pN])/u',
                fn (array $match) => self::ACRONYMS[$match[1]],
                $keyword,
            ))
            ->filter(fn (string $keyword) => mb_strlen($keyword) >= self::MIN_LENGTH
                && mb_strlen($keyword) <= self::MAX_LENGTH
                && preg_match(self::PATTERN, $keyword) === 1
                && ! in_array(self::fold($keyword), self::STOPWORDS, true))
            ->unique()
            ->take(Event::MAX_SEARCH_KEYWORDS)
            ->values()
            ->all();
    }

    public function isStopword(string $word): bool
    {
        return in_array(self::fold($word), self::STOPWORDS, true);
    }

    public function isFiller(string $word): bool
    {
        return in_array(self::fold($word), self::FILLER_WORDS, true);
    }

    /**
     * Long single words lose their inflection so that "programe" also finds
     * "programación" and "programan".
     */
    public function stem(string $word): string
    {
        if (mb_strlen($word) < 7) {
            return $word;
        }

        foreach (self::SUFFIXES as $suffix) {
            if (str_ends_with($word, $suffix) && mb_strlen($word) - mb_strlen($suffix) >= self::MIN_STEM_LENGTH) {
                return mb_substr($word, 0, mb_strlen($word) - mb_strlen($suffix));
            }
        }

        return $word;
    }

    /**
     * Splits a phrase into its meaningful words, so "programación web" finds
     * events that mention either word, and stems each of them.
     *
     * @return array<int, string>
     */
    public function termsFor(string $keyword): array
    {
        return collect(explode(' ', $keyword))
            ->filter(fn (string $word) => mb_strlen($word) >= self::MIN_LENGTH && ! $this->isFiller($word) && ! $this->isStopword($word))
            ->map(fn (string $word) => $this->stem($word))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $keywords
     * @return array<int, string>
     */
    public function searchTerms(array $keywords): array
    {
        return collect($keywords)
            ->flatMap(fn (string $keyword) => $this->termsFor($keyword))
            ->unique()
            ->take(Event::MAX_SEARCH_KEYWORDS)
            ->values()
            ->all();
    }

    /**
     * Returns how the keyword appears in `$text`: the whole phrase when it is
     * present, otherwise each matching word as written in the text.
     *
     * @return array<int, string>
     */
    public function matchesIn(string $keyword, ?string $text): array
    {
        if ($text === null) {
            return [];
        }

        if (str_contains($keyword, ' ') && str_contains(self::fold($text), self::fold($keyword))) {
            return [$keyword];
        }

        return collect($this->termsFor($keyword))
            ->map(fn (string $term) => $this->matchedWord($term, $text))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Returns the first word of `$text` that contains the search term, as
     * written in the text. Null when the text does not contain it once accents
     * and case are ignored.
     */
    public function matchedWord(string $term, ?string $text): ?string
    {
        if ($text === null || ! str_contains(self::fold($text), self::fold($term))) {
            return null;
        }

        foreach (preg_split('/[^\pL\pN+#.-]+/u', $text, -1, PREG_SPLIT_NO_EMPTY) as $word) {
            if (str_contains(self::fold($word), self::fold($term))) {
                return trim($word, '.-');
            }
        }

        return $term;
    }

    public static function fold(string $text): string
    {
        return Str::lower(Str::ascii($text));
    }
}
