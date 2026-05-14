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

  /* Action badges */
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 8px; font-weight: 700; }
  .badge-login       { background: #d1fae5; color: #065f46; }
  .badge-logout      { background: #f1f5f9; color: #475569; }
  .badge-upload      { background: #dbeafe; color: #1e40af; }
  .badge-download    { background: #ede9fe; color: #5b21b6; }
  .badge-update      { background: #fef3c7; color: #92400e; }
  .badge-delete      { background: #fee2e2; color: #991b1b; }
  .badge-user_create { background: #cffafe; color: #155e75; }
  .badge-user_delete { background: #ffe4e6; color: #9f1239; }
  .badge-role_change { background: #ffedd5; color: #9a3412; }
  .badge-default     { background: #f1f5f9; color: #475569; }

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
    <div class="header-title">Rapport — Journaux d'audit</div>
  </div>

  <!-- Active filters -->
  @if($hasFilters)
  <div class="filters">
    <div class="filters-title">Filtres appliqués</div>
    <div class="filters-grid">
      @if($filterAction)   <div class="filter-item"><strong>Action :</strong> {{ $filterAction }}</div>@endif
      @if($filterUser)     <div class="filter-item"><strong>Utilisateur :</strong> {{ $filterUser }}</div>@endif
      @if($filterFrom)     <div class="filter-item"><strong>Du :</strong> {{ \Carbon\Carbon::parse($filterFrom)->format('d/m/Y') }}</div>@endif
      @if($filterTo)       <div class="filter-item"><strong>Au :</strong> {{ \Carbon\Carbon::parse($filterTo)->format('d/m/Y') }}</div>@endif
    </div>
  </div>
  @endif

  <!-- Stats -->
  <div class="stats">
    <div class="stat">
      <div class="stat-value">{{ $logs->count() }}</div>
      <div class="stat-label">Événements exportés</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $logs->whereNotNull('user_id')->pluck('user_id')->unique()->count() }}</div>
      <div class="stat-label">Utilisateurs impliqués</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $logs->pluck('action')->unique()->count() }}</div>
      <div class="stat-label">Types d'actions</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $logs->groupBy(fn($l) => \Carbon\Carbon::parse($l->created_at)->format('Y-m-d'))->count() }}</div>
      <div class="stat-label">Jours d'activité</div>
    </div>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:12%">Action</th>
          <th style="width:32%">Description</th>
          <th style="width:16%">Utilisateur</th>
          <th style="width:14%">Entité</th>
          <th style="width:10%">IP</th>
          <th style="width:16%">Date</th>
        </tr>
      </thead>
      <tbody>
        @forelse($logs as $log)
        <tr>
          <td>
            <span class="badge badge-{{ $log->action ?? 'default' }}">
              {{ $actionLabels[$log->action] ?? $log->action }}
            </span>
          </td>
          <td>{{ $log->description }}</td>
          <td>{{ $log->user?->name ?? 'Système' }}</td>
          <td>
            @if($log->model_type)
              {{ class_basename($log->model_type) }} #{{ $log->model_id }}
            @else
              —
            @endif
          </td>
          <td style="font-family: monospace; font-size: 8px;">{{ $log->ip_address ?? '—' }}</td>
          <td>{{ \Carbon\Carbon::parse($log->created_at)->format('d/m/Y H:i') }}</td>
        </tr>
        @empty
        <tr>
          <td colspan="6" style="text-align:center; padding: 20px; color: #94a3b8;">
            Aucun événement trouvé pour les filtres appliqués.
          </td>
        </tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>RIMArch — Rapport d'audit confidentiel</span>
    <span>{{ now()->format('d/m/Y') }}</span>
  </div>

</body>
</html>
