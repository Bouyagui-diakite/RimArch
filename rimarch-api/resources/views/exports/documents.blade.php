<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1e293b; background: #fff; }

  /* Header */
  .header { background: #1e40af; color: #fff; padding: 20px 24px 16px; margin-bottom: 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
  .logo span { opacity: .65; font-size: 11px; font-weight: 400; display: block; margin-top: 2px; }
  .header-meta { text-align: right; font-size: 9px; opacity: .8; line-height: 1.6; }
  .header-title { margin-top: 14px; font-size: 14px; font-weight: 600; opacity: .95; }

  /* Filters summary */
  .filters { margin: 0 24px 16px; padding: 10px 14px; background: #f1f5f9; border-left: 3px solid #3b82f6; border-radius: 4px; }
  .filters-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-bottom: 5px; }
  .filters-grid { display: flex; gap: 20px; flex-wrap: wrap; }
  .filter-item { font-size: 9px; color: #475569; }
  .filter-item strong { color: #1e293b; }

  /* Stats bar */
  .stats { margin: 0 24px 16px; display: flex; gap: 16px; }
  .stat { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .stat-value { font-size: 18px; font-weight: 700; color: #1e40af; }
  .stat-label { font-size: 9px; color: #64748b; margin-top: 2px; }

  /* Table */
  .table-wrap { margin: 0 24px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1e40af; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:nth-child(odd)  { background: #ffffff; }
  tbody td { padding: 7px 10px; font-size: 9px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }

  /* Type badges */
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 8px; font-weight: 700; }
  .badge-pdf   { background: #fee2e2; color: #991b1b; }
  .badge-word  { background: #dbeafe; color: #1e40af; }
  .badge-sheet { background: #d1fae5; color: #065f46; }
  .badge-image { background: #ede9fe; color: #5b21b6; }
  .badge-text  { background: #f1f5f9; color: #475569; }
  .badge-file  { background: #f1f5f9; color: #475569; }

  /* Category badge */
  .cat { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 8px; font-weight: 600; background: #e2e8f0; color: #475569; }

  /* Footer */
  .footer { margin-top: 20px; padding: 10px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div class="logo">
        RIMArch
        <span>Système de gestion des archives</span>
      </div>
      <div class="header-meta">
        Généré le {{ now()->format('d/m/Y à H:i') }}<br>
        Par : {{ auth()->user()?->name ?? 'Administrateur' }}
      </div>
    </div>
    <div class="header-title">Rapport — Catalogue des documents archivés</div>
  </div>

  <!-- Active filters -->
  @if($hasFilters)
  <div class="filters">
    <div class="filters-title">Filtres appliqués</div>
    <div class="filters-grid">
      @if($filterSearch)    <div class="filter-item"><strong>Recherche :</strong> {{ $filterSearch }}</div>@endif
      @if($filterCategorie) <div class="filter-item"><strong>Catégorie :</strong> {{ $filterCategorie }}</div>@endif
      @if($filterType)      <div class="filter-item"><strong>Type :</strong> {{ $filterType }}</div>@endif
      @if($filterFrom)      <div class="filter-item"><strong>Du :</strong> {{ \Carbon\Carbon::parse($filterFrom)->format('d/m/Y') }}</div>@endif
      @if($filterTo)        <div class="filter-item"><strong>Au :</strong> {{ \Carbon\Carbon::parse($filterTo)->format('d/m/Y') }}</div>@endif
      @if($filterSizeMin)   <div class="filter-item"><strong>Taille min :</strong> {{ $filterSizeMin }} Ko</div>@endif
      @if($filterSizeMax)   <div class="filter-item"><strong>Taille max :</strong> {{ $filterSizeMax }} Ko</div>@endif
    </div>
  </div>
  @endif

  <!-- Stats -->
  <div class="stats">
    <div class="stat">
      <div class="stat-value">{{ $documents->count() }}</div>
      <div class="stat-label">Documents exportés</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $documents->pluck('uploaded_by')->unique()->count() }}</div>
      <div class="stat-label">Contributeurs</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $documents->pluck('categorie')->unique()->count() }}</div>
      <div class="stat-label">Catégories</div>
    </div>
    <div class="stat">
      @php
        $totalBytes = $documents->sum('file_size');
        $totalSize  = $totalBytes < 1024*1024
          ? round($totalBytes/1024, 1).' Ko'
          : round($totalBytes/(1024*1024), 1).' Mo';
      @endphp
      <div class="stat-value">{{ $totalSize }}</div>
      <div class="stat-label">Stockage total</div>
    </div>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:5%">#</th>
          <th style="width:28%">Titre</th>
          <th style="width:10%">Type</th>
          <th style="width:12%">Catégorie</th>
          <th style="width:18%">Uploadé par</th>
          <th style="width:9%">Taille</th>
          <th style="width:9%">Date d'ajout</th>
          <th style="width:9%">Mis à jour</th>
        </tr>
      </thead>
      <tbody>
        @forelse($documents as $doc)
        @php
          $mime = $doc->file_type ?? '';
          if (str_contains($mime, 'pdf'))                              $typeKey = 'pdf';
          elseif (str_contains($mime, 'word') || str_contains($mime, 'doc')) $typeKey = 'word';
          elseif (str_contains($mime, 'sheet') || str_contains($mime, 'xls')) $typeKey = 'sheet';
          elseif (str_contains($mime, 'image'))                        $typeKey = 'image';
          elseif (str_contains($mime, 'text'))                         $typeKey = 'text';
          else                                                          $typeKey = 'file';
          $typeLabels = ['pdf'=>'PDF','word'=>'DOC','sheet'=>'XLS','image'=>'IMG','text'=>'TXT','file'=>'FILE'];
          $sizeBytes  = $doc->file_size ?? 0;
          $sizeStr    = $sizeBytes < 1024*1024 ? round($sizeBytes/1024,1).' Ko' : round($sizeBytes/(1024*1024),1).' Mo';
        @endphp
        <tr>
          <td style="color:#94a3b8;">{{ $doc->id }}</td>
          <td>
            <strong style="color:#1e293b;">{{ $doc->title }}</strong>
            <div style="color:#94a3b8; font-size:8px; margin-top:1px;">{{ $doc->file_name }}</div>
          </td>
          <td><span class="badge badge-{{ $typeKey }}">{{ $typeLabels[$typeKey] }}</span></td>
          <td><span class="cat">{{ $doc->categorie }}</span></td>
          <td>{{ $doc->uploader?->name ?? '—' }}</td>
          <td>{{ $sizeStr }}</td>
          <td>{{ \Carbon\Carbon::parse($doc->created_at)->format('d/m/Y') }}</td>
          <td>{{ \Carbon\Carbon::parse($doc->updated_at)->format('d/m/Y') }}</td>
        </tr>
        @empty
        <tr>
          <td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">
            Aucun document trouvé pour les filtres appliqués.
          </td>
        </tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>RIMArch — Catalogue des archives confidentiel</span>
    <span>{{ now()->format('d/m/Y') }}</span>
  </div>

</body>
</html>
