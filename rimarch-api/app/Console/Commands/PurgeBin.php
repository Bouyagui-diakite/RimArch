<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeBin extends Command
{
    protected $signature   = 'bin:purge';
    protected $description = 'Permanently delete documents that have been in the bin for more than 30 days';

    public function handle(): void
    {
        $expired = Document::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(30))
            ->get();

        foreach ($expired as $doc) {
            Storage::disk('local')->delete($doc->file_path);
            $doc->forceDelete();
        }

        $this->info("Purged {$expired->count()} expired document(s) from the bin.");
    }
}
