<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProvisionAdminCommand extends Command
{
    protected $signature = 'polilink:provision-admin
        {email : ESPOL email for the administrator account}
        {--first-name=Administrador : First name for a new account}
        {--last-name=PoliLink : Last name for a new account}';

    protected $description = 'Create or promote a PoliLink catalog administrator';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || ! str_ends_with($email, '@espol.edu.ec')) {
            $this->error('The administrator email must be a valid @espol.edu.ec address.');

            return self::FAILURE;
        }

        $existingUser = User::query()->where('email', $email)->first();

        if ($existingUser) {
            $this->promote($existingUser);
            $this->info("Administrator access enabled for {$email}.");

            return self::SUCCESS;
        }

        $password = $this->secret('Password for the new administrator');
        $passwordConfirmation = $this->secret('Confirm the password');

        if (! is_string($password) || strlen($password) < 8 || $password !== $passwordConfirmation) {
            $this->error('The password must contain at least 8 characters and match its confirmation.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($email, $password): void {
            $user = User::query()->create([
                'first_name' => (string) ($this->option('first-name') ?: 'Administrator'),
                'last_name' => (string) ($this->option('last-name') ?: 'PoliLink'),
                'email' => $email,
                'email_verified_at' => now(),
                'password' => $password,
            ]);

            $this->promote($user);
        });

        $this->info("Administrator account created for {$email}.");

        return self::SUCCESS;
    }

    private function promote(User $user): void
    {
        $user->forceFill(['is_admin' => true])->save();
    }
}
