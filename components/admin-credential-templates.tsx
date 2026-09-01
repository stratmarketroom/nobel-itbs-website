'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useAdminFormChanges, useAdminUnsavedChanges } from '@/components/admin-dirty-guard';
import {
  templateFieldKeys,
  type TemplateDocument,
  type TemplatePlacement,
  type TemplateVersion,
  type TemplateWorkspace,
} from '@/lib/credential-templates/admin-types';
import { canonicalOrigin } from '@/lib/seo/urls';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Notice = { kind: 'success' | 'error'; text: string } | null;
type Selection = { packageId: string; versionId: string; documentId: string; page: number };

const fieldLabels: Record<TemplatePlacement['fieldKey'], string> = {
  holder_name: 'Holder name',
  programme_title: 'Programme title',
  credential_type: 'Credential type',
  document_number: 'Document number',
  issue_date: 'Issue date',
  completion_date: 'Completion date',
  programme_run_label: 'Programme run',
  verification_qr: 'Verification QR',
  verification_url: 'Verification URL',
  static_text: 'Static text',
};

const sampleValues: Record<TemplatePlacement['fieldKey'], string> = {
  holder_name: 'Olena Kovalenko',
  programme_title: 'General Psychology',
  credential_type: 'Professional development certificate',
  document_number: 'NITBS-C-2026-000123',
  issue_date: '25.08.2026',
  completion_date: '20.08.2026',
  programme_run_label: 'Autumn 2026',
  verification_qr: 'QR',
  verification_url: `${canonicalOrigin}/verify/sample-token-not-for-production`,
  static_text: 'Additional document text',
};

const geometryFields = [
  { key: 'xPoints', label: 'X position (pt)' },
  { key: 'yPoints', label: 'Y position (pt)' },
  { key: 'widthPoints', label: 'Width (pt)' },
  { key: 'heightPoints', label: 'Height (pt)' },
] as const;

function message(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return fallback;
}

function initialPlacement(
  fieldKey: TemplatePlacement['fieldKey'],
  pageNumber: number,
  order: number,
): TemplatePlacement {
  const isQr = fieldKey === 'verification_qr';
  return {
    pageNumber,
    fieldKey,
    occurrenceOrder: order,
    xPoints: 40,
    yPoints: 40 + order * 8,
    widthPoints: isQr ? 90 : 260,
    heightPoints: isQr ? 90 : 34,
    fontFamily: isQr ? null : 'noto_sans',
    fontSizePoints: isQr ? null : 16,
    minFontSizePoints: isQr ? null : 9,
    fontWeight: isQr ? null : 400,
    fontColor: isQr ? null : '#111111',
    textAlignment: 'left',
    fitMode: isQr ? 'fixed' : 'shrink_to_fit',
    dateFormat: fieldKey.includes('date') ? 'DD.MM.YYYY' : null,
    staticText: fieldKey === 'static_text' ? 'Additional document text' : null,
    isRequired: true,
  };
}

function nextTabIndex(event: KeyboardEvent<HTMLButtonElement>, current: number, count: number): number | null {
  if (event.key === 'ArrowRight') return (current + 1) % count;
  if (event.key === 'ArrowLeft') return (current - 1 + count) % count;
  if (event.key === 'Home') return 0;
  if (event.key === 'End') return count - 1;
  return null;
}

export function AdminCredentialTemplates() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const pageSelectId = useId();
  const canvas = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TemplateWorkspace | null>(null);
  const [selection, setSelection] = useState<Selection>({
    packageId: '',
    versionId: '',
    documentId: '',
    page: 1,
  });
  const [draft, setDraft] = useState<TemplatePlacement[]>([]);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [canvasScale, setCanvasScale] = useState(1);

  const token = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) throw new Error('Sign in with MFA to manage template packages.');
    return session.session.access_token;
  }, [supabase]);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${await token()}`, ...init.headers },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null) as unknown;
    if (!response.ok) throw new Error(message(payload, 'Template operation failed.'));
    return payload;
  }, [token]);

  const load = useCallback(async (): Promise<boolean> => {
    setBusy('load');
    setNotice(null);
    try {
      const next = await api('/api/v1/admin/credential-templates') as TemplateWorkspace;
      setData(next);
      setSelection((current) => {
        const selectedPackage = next.packages.find((item) => item.id === current.packageId) ?? next.packages[0];
        const selectedVersion = selectedPackage?.versions.find((item) => item.id === current.versionId)
          ?? selectedPackage?.versions[0];
        const selectedDocument = selectedVersion?.documents.find((item) => item.id === current.documentId)
          ?? selectedVersion?.documents[0];
        return {
          packageId: selectedPackage?.id ?? '',
          versionId: selectedVersion?.id ?? '',
          documentId: selectedDocument?.id ?? '',
          page: Math.min(current.page, selectedDocument?.pageCount ?? 1),
        };
      });
      return true;
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Template workspace could not be loaded.',
      });
      return false;
    } finally {
      setBusy('');
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPackage = data?.packages.find((item) => item.id === selection.packageId);
  const selectedVersion = selectedPackage?.versions.find((item) => item.id === selection.versionId);
  const selectedDocument = selectedVersion?.documents.find((item) => item.id === selection.documentId);
  const selectedPage = selectedDocument?.pages.find((item) => item.pageNumber === selection.page);
  const placementsDirty = Boolean(
    selectedDocument && JSON.stringify(draft) !== JSON.stringify(selectedDocument.placements),
  );
  const formGuard = useAdminFormChanges('Template package form draft');
  useAdminUnsavedChanges(placementsDirty, 'Template placement draft');

  const previewValues: Record<string, string> = {
    ...sampleValues,
    programme_title: data?.references.programmes.find((item) => item.id === selectedPackage?.programmeId)?.label
      ?? sampleValues.programme_title,
    credential_type: data?.references.credentialTypes.find((item) => item.id === selectedPackage?.credentialTypeId)?.label
      ?? sampleValues.credential_type,
  };

  useEffect(() => {
    setDraft(selectedDocument?.placements ?? []);
  }, [selectedDocument]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !selectedPage) return;
    const measure = () => setCanvasScale(element.getBoundingClientRect().width / selectedPage.widthPoints);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [selectedPage]);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setImageUrl('');
    if (!selectedDocument || !selectedVersion) return;

    void (async () => {
      try {
        const response = await fetch(
          `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/documents/${selectedDocument.id}/pages/${selection.page}`,
          { headers: { Authorization: `Bearer ${await token()}` }, cache: 'no-store' },
        );
        if (!response.ok) throw new Error('Page preview could not be loaded.');
        objectUrl = URL.createObjectURL(await response.blob());
        if (active) setImageUrl(objectUrl);
      } catch (error) {
        if (active) {
          setNotice({
            kind: 'error',
            text: error instanceof Error ? error.message : 'Page preview could not be loaded.',
          });
        }
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDocument, selection.page, selectedVersion, token]);

  async function run(key: string, task: () => Promise<unknown>, success: string) {
    setBusy(key);
    setNotice(null);
    try {
      await task();
      formGuard.markClean();
      if (await load()) setNotice({ kind: 'success', text: success });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Template operation failed.' });
    } finally {
      setBusy('');
    }
  }

  function selectPackage(id: string) {
    if (!formGuard.confirmDiscardChanges()) return;
    const nextPackage = data?.packages.find((item) => item.id === id);
    const nextVersion = nextPackage?.versions[0];
    setSelection({
      packageId: id,
      versionId: nextVersion?.id ?? '',
      documentId: nextVersion?.documents[0]?.id ?? '',
      page: 1,
    });
    formGuard.markClean();
    setNotice(null);
  }

  function selectVersion(version: TemplateVersion): boolean {
    if (!selectedPackage || !formGuard.confirmDiscardChanges()) return false;
    setSelection({
      packageId: selectedPackage.id,
      versionId: version.id,
      documentId: version.documents[0]?.id ?? '',
      page: 1,
    });
    formGuard.markClean();
    setNotice(null);
    return true;
  }

  function selectDocument(id: string): boolean {
    if (!formGuard.confirmDiscardChanges()) return false;
    setSelection((current) => ({ ...current, documentId: id, page: 1 }));
    formGuard.markClean();
    setNotice(null);
    return true;
  }

  function updatePlacement(index: number, patch: Partial<TemplatePlacement>) {
    setDraft((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
    setNotice(null);
  }

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (selectedVersion?.status !== 'draft' || !selectedPage || !canvas.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, item: draft[index] };
    const rect = canvas.current.getBoundingClientRect();
    const move = (moveEvent: PointerEvent) => updatePlacement(index, {
      xPoints: Math.max(
        0,
        Math.min(
          selectedPage.widthPoints - start.item.widthPoints,
          start.item.xPoints + (moveEvent.clientX - start.x) * selectedPage.widthPoints / rect.width,
        ),
      ),
      yPoints: Math.max(
        0,
        Math.min(
          selectedPage.heightPoints - start.item.heightPoints,
          start.item.yPoints + (moveEvent.clientY - start.y) * selectedPage.heightPoints / rect.height,
        ),
      ),
    });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function movePlacementWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (selectedVersion?.status !== 'draft' || !selectedPage) return;
    const placement = draft[index];
    const step = event.shiftKey ? 10 : 1;
    let xPoints = placement.xPoints;
    let yPoints = placement.yPoints;
    if (event.key === 'ArrowLeft') xPoints -= step;
    else if (event.key === 'ArrowRight') xPoints += step;
    else if (event.key === 'ArrowUp') yPoints -= step;
    else if (event.key === 'ArrowDown') yPoints += step;
    else return;

    event.preventDefault();
    updatePlacement(index, {
      xPoints: Math.max(0, Math.min(selectedPage.widthPoints - placement.widthPoints, xPoints)),
      yPoints: Math.max(0, Math.min(selectedPage.heightPoints - placement.heightPoints, yPoints)),
    });
  }

  const visiblePlacements = draft
    .map((placement, index) => ({ placement, index }))
    .filter(({ placement }) => placement.pageNumber === selection.page);

  return (
    <main
      className="template-workspace"
      aria-labelledby="template-workspace-title"
      onChangeCapture={(event) => {
        if ((event.target as Element).closest('form')) formGuard.markDirty();
      }}
    >
      <header className="admin-module-header">
        <div>
          <p className="admin-kicker">Credentials · PDF templates</p>
          <h1 id="template-workspace-title">Template packages</h1>
          <p>Create versioned private PDF packages and position approved credential fields on any page.</p>
        </div>
        <button
          type="button"
          className="template-secondary-action"
          data-admin-guard-navigation
          onClick={() => void load()}
          disabled={busy === 'load'}
        >
          {busy === 'load' ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {notice ? (
        <div className={`template-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          <span>{notice.text}</span>
          {!data && notice.kind === 'error' ? (
            <button type="button" onClick={() => void load()}>Retry</button>
          ) : null}
        </div>
      ) : null}

      {!data ? (
        <section className="template-loading" aria-busy="true" aria-label="Loading template workspace">
          <span />
          <span />
          <span />
        </section>
      ) : (
        <div className="template-layout">
          <aside className="template-packages" aria-labelledby="template-package-list-title">
            <div className="template-panel-heading">
              <div>
                <h2 id="template-package-list-title">Packages</h2>
                <span>{data.packages.length} total</span>
              </div>
              <CreatePackage
                data={data}
                busy={busy}
                onCreate={(body) => run(
                  'create',
                  () => api('/api/v1/admin/credential-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  }),
                  'Package and draft v1 created.',
                )}
              />
            </div>

            <nav className="template-package-list" aria-label="Template packages">
              {data.packages.map((item) => (
                <button
                  type="button"
                  aria-pressed={item.id === selectedPackage?.id}
                  key={item.id}
                  onClick={() => selectPackage(item.id)}
                >
                  <strong>{item.displayName}</strong>
                  <span>{item.languageCode.toUpperCase()} · {item.variantCode}</span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="template-main" aria-labelledby="template-package-title">
            {selectedPackage ? (
              <>
                <div className="template-toolbar">
                  <div>
                    <p>Selected package</p>
                    <h2 id="template-package-title">{selectedPackage.displayName}</h2>
                    <span>{selectedPackage.versions.length} version{selectedPackage.versions.length === 1 ? '' : 's'}</span>
                  </div>
                  <button
                    type="button"
                    className="template-secondary-action"
                    data-admin-guard-navigation
                    onClick={() => void run(
                      'version',
                      () => api(`/api/v1/admin/credential-templates/${selectedPackage.id}/versions`, { method: 'POST' }),
                      'New draft created.',
                    )}
                    disabled={Boolean(selectedPackage.versions.find((item) => item.status === 'draft')) || Boolean(busy)}
                  >
                    New draft
                  </button>
                </div>

                <VersionTabs
                  versions={selectedPackage.versions}
                  selected={selectedVersion?.id ?? ''}
                  onSelect={selectVersion}
                />

                {selectedVersion ? (
                  <div id="template-version-panel" role="tabpanel" tabIndex={0} aria-labelledby={`template-version-tab-${selectedVersion.id}`}>
                    <div className="template-actions" aria-label="Template version actions">
                      <span className={`template-status ${selectedVersion.status}`}>{selectedVersion.status}</span>
                      <div>
                        <button
                          type="button"
                          data-admin-guard-navigation
                          onClick={() => void run(
                            'validate',
                            () => api(
                              `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/validate`,
                              { method: 'POST' },
                            ).then((result) => {
                              const validation = result as { valid: boolean; issues: { message: string }[] };
                              if (!validation.valid) throw new Error(validation.issues.map((issue) => issue.message).join(' '));
                            }),
                            'Validation passed.',
                          )}
                          disabled={Boolean(busy)}
                        >
                          Validate
                        </button>
                        {selectedVersion.status === 'draft' ? (
                          <button
                            type="button"
                            data-admin-guard-navigation
                            className="primary"
                            onClick={() => {
                              if (window.confirm('Publish this version? Published content is immutable.')) {
                                void run(
                                  'publish',
                                  () => api(
                                    `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/publish`,
                                    { method: 'POST' },
                                  ),
                                  'Version published.',
                                );
                              }
                            }}
                            disabled={Boolean(busy)}
                          >
                            Publish immutable version
                          </button>
                        ) : null}
                        {selectedVersion.status === 'published' ? (
                          <button
                            type="button"
                            data-admin-guard-navigation
                            onClick={() => {
                              if (window.confirm('Retire this version for future use?')) {
                                void run(
                                  'retire',
                                  () => api(
                                    `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/retire`,
                                    { method: 'POST' },
                                  ),
                                  'Version retired.',
                                );
                              }
                            }}
                            disabled={Boolean(busy)}
                          >
                            Retire
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <DocumentBar
                      data={data}
                      version={selectedVersion}
                      selected={selectedDocument?.id ?? ''}
                      busy={busy}
                      onSelect={selectDocument}
                      onUpload={(form) => run(
                        'upload',
                        () => api(`/api/v1/admin/credential-templates/versions/${selectedVersion.id}/documents`, {
                          method: 'POST',
                          body: form,
                        }),
                        'Private PDF uploaded.',
                      )}
                      onDelete={(item) => run(
                        'delete',
                        () => api(
                          `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/documents/${item.id}`,
                          { method: 'DELETE' },
                        ),
                        `${item.adminLabel} deleted.`,
                      )}
                    />

                    {selectedDocument && selectedPage ? (
                      <section
                        id="template-document-panel"
                        role="tabpanel"
                        tabIndex={0}
                        aria-labelledby={`template-document-tab-${selectedDocument.id}`}
                        className="template-document-editor"
                      >
                        <div className="template-pagebar">
                          <label htmlFor={pageSelectId}>
                            <span>Preview page</span>
                            <select
                              id={pageSelectId}
                              value={selection.page}
                              onChange={(event) => setSelection((current) => ({
                                ...current,
                                page: Number(event.target.value),
                              }))}
                            >
                              {selectedDocument.pages.map((item) => (
                                <option value={item.pageNumber} key={item.pageNumber}>
                                  {item.pageNumber} of {selectedDocument.pageCount}
                                </option>
                              ))}
                            </select>
                          </label>
                          <span role="note">Private non-production sample · values below are fictional</span>
                        </div>

                        <div className="placement-layout">
                          <div>
                            <p id="template-placement-instructions" className="template-placement-help">
                              Drag a field, use arrow keys for 1 pt steps, or hold Shift for 10 pt steps. Exact values remain editable in the field panel.
                            </p>
                            <div
                              ref={canvas}
                              className="template-canvas"
                              style={{ aspectRatio: `${selectedPage.widthPoints}/${selectedPage.heightPoints}` }}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`Private source preview of ${selectedDocument.adminLabel}, page ${selection.page}`}
                                />
                              ) : (
                                <div className="template-preview-loading" aria-label="Loading private page preview" aria-busy="true" />
                              )}
                              {visiblePlacements.map(({ placement, index }) => (
                                <button
                                  type="button"
                                  aria-label={`Move ${fieldLabels[placement.fieldKey]} placement`}
                                  aria-describedby="template-placement-instructions"
                                  aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                                  key={`${placement.fieldKey}-${placement.occurrenceOrder}`}
                                  onPointerDown={(event) => beginDrag(event, index)}
                                  onKeyDown={(event) => movePlacementWithKeyboard(event, index)}
                                  disabled={selectedVersion.status !== 'draft'}
                                  className={`placement-box ${placement.fieldKey === 'verification_qr' ? 'qr' : ''}`}
                                  style={{
                                    left: `${placement.xPoints / selectedPage.widthPoints * 100}%`,
                                    top: `${placement.yPoints / selectedPage.heightPoints * 100}%`,
                                    width: `${placement.widthPoints / selectedPage.widthPoints * 100}%`,
                                    height: `${placement.heightPoints / selectedPage.heightPoints * 100}%`,
                                    fontSize: `${(placement.fontSizePoints ?? 10) * canvasScale}px`,
                                    fontWeight: placement.fontWeight ?? 400,
                                    color: placement.fontColor ?? '#111111',
                                    lineHeight: placement.fitMode === 'wrap' ? 1.08 : 1,
                                  }}
                                >
                                  <span
                                    className="placement-value"
                                    style={{
                                      textAlign: placement.textAlignment,
                                      whiteSpace: placement.fitMode === 'wrap' ? 'normal' : 'nowrap',
                                    }}
                                  >
                                    {previewValues[placement.fieldKey]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <aside className="placement-panel" aria-labelledby="placement-panel-title">
                            <div className="placement-panel-heading">
                              <div>
                                <h3 id="placement-panel-title">Fields on page {selection.page}</h3>
                                <span>{visiblePlacements.length} placed</span>
                              </div>
                              {selectedVersion.status === 'draft' ? (
                                <label htmlFor="template-add-field">
                                  <span>Add field</span>
                                  <select
                                    id="template-add-field"
                                    defaultValue=""
                                    onChange={(event) => {
                                      if (!event.target.value) return;
                                      const field = event.target.value as TemplatePlacement['fieldKey'];
                                      setDraft((items) => [
                                        ...items,
                                        initialPlacement(
                                          field,
                                          selection.page,
                                          items.filter((item) => (
                                            item.pageNumber === selection.page && item.fieldKey === field
                                          )).length,
                                        ),
                                      ]);
                                      event.target.value = '';
                                    }}
                                  >
                                    <option value="">Choose a field…</option>
                                    {templateFieldKeys.map((key) => (
                                      <option key={key} value={key}>{fieldLabels[key]}</option>
                                    ))}
                                  </select>
                                </label>
                              ) : (
                                <p>This published version is immutable.</p>
                              )}
                            </div>

                            {visiblePlacements.length ? visiblePlacements.map(({ placement, index }) => (
                              <FieldEditor
                                key={`${placement.fieldKey}-${placement.occurrenceOrder}`}
                                value={placement}
                                readonly={selectedVersion.status !== 'draft'}
                                onChange={(patch) => updatePlacement(index, patch)}
                                onRemove={() => setDraft((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                              />
                            )) : (
                              <p className="template-field-empty">No fields are placed on this page.</p>
                            )}

                            {selectedVersion.status === 'draft' ? (
                              <button
                                type="button"
                                className="primary save-fields"
                                onClick={() => void run(
                                  'placements',
                                  () => api(
                                    `/api/v1/admin/credential-templates/versions/${selectedVersion.id}/placements`,
                                    {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ documentId: selectedDocument.id, placements: draft }),
                                    },
                                  ),
                                  'Field placements saved.',
                                )}
                                disabled={Boolean(busy) || !placementsDirty}
                              >
                                {busy === 'placements' ? 'Saving…' : 'Save all placements'}
                              </button>
                            ) : null}
                          </aside>
                        </div>
                      </section>
                    ) : (
                      <div className="template-empty">
                        <h3>No source PDF</h3>
                        <p>Upload the first private PDF to begin placing fields.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="template-empty">
                <h2 id="template-package-title">No template packages</h2>
                <p>Create a package to define its issuing context and draft version.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function VersionTabs({
  versions,
  selected,
  onSelect,
}: {
  versions: TemplateVersion[];
  selected: string;
  onSelect: (version: TemplateVersion) => boolean;
}) {
  return (
    <div className="template-tabs" role="tablist" aria-label="Template versions">
      {versions.map((version, index) => {
        const active = version.id === selected;
        return (
          <button
            id={`template-version-tab-${version.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="template-version-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => { onSelect(version); }}
            onKeyDown={(event) => {
              const nextIndex = nextTabIndex(event, index, versions.length);
              if (nextIndex === null) return;
              event.preventDefault();
              const target = versions[nextIndex];
              if (!onSelect(target)) return;
              window.requestAnimationFrame(() => {
                document.getElementById(`template-version-tab-${target.id}`)?.focus();
              });
            }}
            key={version.id}
          >
            <strong>v{version.versionNumber}</strong>
            <span>{version.status}</span>
          </button>
        );
      })}
    </div>
  );
}

function CreatePackage({
  data,
  busy,
  onCreate,
}: {
  data: TemplateWorkspace;
  busy: string;
  onCreate: (body: Record<string, FormDataEntryValue>) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const formId = `${id}-form`;

  return (
    <>
      <button
        className="new-package"
        type="button"
        aria-expanded={open}
        aria-controls={formId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Close form' : 'New package'}
      </button>
      {open ? (
        <form
          id={formId}
          className="compact-form"
          aria-label="Create template package"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(Object.fromEntries(new FormData(event.currentTarget)));
          }}
        >
          <label htmlFor={`${id}-programme`}>
            <span>Programme</span>
            <select id={`${id}-programme`} name="programmeId" required defaultValue="">
              <option value="" disabled>Choose a programme…</option>
              {data.references.programmes.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-run`}>
            <span>Programme run</span>
            <select id={`${id}-run`} name="programmeRunId" defaultValue="">
              <option value="">Any run</option>
              {data.references.programmeRuns.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-credential-type`}>
            <span>Credential type</span>
            <select id={`${id}-credential-type`} name="credentialTypeId" required defaultValue="">
              <option value="" disabled>Choose a credential type…</option>
              {data.references.credentialTypes.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-language`}>
            <span>Document language</span>
            <select id={`${id}-language`} name="languageCode" required defaultValue={data.references.languages[0]?.code}>
              {data.references.languages.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-variant`}>
            <span>Variant code</span>
            <input id={`${id}-variant`} name="variantCode" defaultValue="standard" required />
          </label>
          <label htmlFor={`${id}-display-name`}>
            <span>Package name</span>
            <input id={`${id}-display-name`} name="displayName" required />
          </label>
          <button type="submit" className="primary" disabled={Boolean(busy)}>
            {busy === 'create' ? 'Creating…' : 'Create package'}
          </button>
        </form>
      ) : null}
    </>
  );
}

function DocumentBar({
  data,
  version,
  selected,
  busy,
  onSelect,
  onUpload,
  onDelete,
}: {
  data: TemplateWorkspace;
  version: TemplateVersion;
  selected: string;
  busy: string;
  onSelect: (id: string) => boolean;
  onUpload: (form: FormData) => void;
  onDelete: (item: TemplateDocument) => void;
}) {
  const id = useId();
  const selectedTemplateDocument = version.documents.find((item) => item.id === selected);
  return (
    <section className="document-bar" aria-labelledby={`${id}-title`}>
      <div className="document-bar-heading">
        <div>
          <h3 id={`${id}-title`}>Source documents</h3>
          <span>{version.documents.length} PDF{version.documents.length === 1 ? '' : 's'}</span>
        </div>
        {version.documents.length ? (
          <div className="document-tab-row">
            <div className="document-tabs" role="tablist" aria-label="Template source documents">
              {version.documents.map((templateDocument, index) => {
                const active = templateDocument.id === selected;
                return (
                  <button
                      key={templateDocument.id}
                      id={`template-document-tab-${templateDocument.id}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls="template-document-panel"
                      tabIndex={active ? 0 : -1}
                      onClick={() => { onSelect(templateDocument.id); }}
                      onKeyDown={(event) => {
                        const nextIndex = nextTabIndex(event, index, version.documents.length);
                        if (nextIndex === null) return;
                        event.preventDefault();
                        const target = version.documents[nextIndex];
                        if (!onSelect(target.id)) return;
                        window.requestAnimationFrame(() => {
                          document.getElementById(`template-document-tab-${target.id}`)?.focus();
                        });
                      }}
                    >
                      <strong>{templateDocument.adminLabel}</strong>
                      <span>{templateDocument.pageCount} page{templateDocument.pageCount === 1 ? '' : 's'}{templateDocument.isPrimary ? ' · primary' : ''}</span>
                    </button>
                );
              })}
            </div>
            {version.status === 'draft' && selectedTemplateDocument ? (
              <button
                type="button"
                className="document-delete"
                aria-label={`Delete ${selectedTemplateDocument.adminLabel}`}
                disabled={Boolean(busy)}
                onClick={() => {
                  if (window.confirm(`Delete ${selectedTemplateDocument.adminLabel}? This removes its private PDF, pages, and placements.`)) {
                    onDelete(selectedTemplateDocument);
                  }
                }}
              >
                Delete selected
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {version.status === 'draft' ? (
        <form
          className="document-upload-form"
          aria-label="Upload private template PDF"
          onSubmit={(event) => {
            event.preventDefault();
            onUpload(new FormData(event.currentTarget));
          }}
        >
          <label htmlFor={`${id}-file`}>
            <span>Source PDF</span>
            <input id={`${id}-file`} type="file" name="file" accept="application/pdf" required />
          </label>
          <label htmlFor={`${id}-file-type`}>
            <span>File type</span>
            <select id={`${id}-file-type`} name="fileTypeId" required defaultValue="">
              <option value="" disabled>Choose a type…</option>
              {data.references.fileTypes.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-admin-label`}>
            <span>Admin label</span>
            <input id={`${id}-admin-label`} name="adminLabel" placeholder="Certificate" required />
          </label>
          <label htmlFor={`${id}-filename`}>
            <span>Output filename</span>
            <input id={`${id}-filename`} name="outputFilenamePattern" defaultValue="certificate.pdf" required />
          </label>
          <label htmlFor={`${id}-sort-order`}>
            <span>Sort order</span>
            <input id={`${id}-sort-order`} name="sortOrder" type="number" min="0" defaultValue={version.documents.length} />
          </label>
          <label className="template-checkbox" htmlFor={`${id}-primary`}>
            <input id={`${id}-primary`} name="isPrimary" type="checkbox" value="true" />
            <span>Primary document</span>
          </label>
          <button type="submit" disabled={Boolean(busy)}>
            {busy === 'upload' ? 'Uploading…' : 'Upload PDF'}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function FieldEditor({
  value,
  readonly,
  onChange,
  onRemove,
}: {
  value: TemplatePlacement;
  readonly: boolean;
  onChange: (patch: Partial<TemplatePlacement>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const isQr = value.fieldKey === 'verification_qr';
  return (
    <fieldset disabled={readonly} className="placement-fieldset">
      <legend>
        <span>{fieldLabels[value.fieldKey]}</span>
        {readonly ? <small>Read-only</small> : null}
      </legend>

      <div className="field-grid geometry-grid">
        {geometryFields.map(({ key, label }) => (
          <label htmlFor={`${id}-${key}`} key={key}>
            <span>{label}</span>
            <input
              id={`${id}-${key}`}
              type="number"
              step="0.1"
              value={Math.round(value[key] * 10) / 10}
              onChange={(event) => onChange({ [key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>

      {!isQr ? (
        <div className="field-grid">
          <label htmlFor={`${id}-font-size`}>
            <span>Font size (pt)</span>
            <input id={`${id}-font-size`} type="number" min="1" step="0.1" value={value.fontSizePoints ?? 16} onChange={(event) => onChange({ fontSizePoints: Number(event.target.value) })} />
          </label>
          <label htmlFor={`${id}-minimum-size`}>
            <span>Minimum size (pt)</span>
            <input id={`${id}-minimum-size`} type="number" min="1" step="0.1" value={value.minFontSizePoints ?? 9} onChange={(event) => onChange({ minFontSizePoints: Number(event.target.value) })} />
          </label>
          <label htmlFor={`${id}-weight`}>
            <span>Font weight</span>
            <select id={`${id}-weight`} value={value.fontWeight ?? 400} onChange={(event) => onChange({ fontWeight: Number(event.target.value) })}>
              <option value="400">Regular</option><option value="500">Medium</option><option value="600">Semi-bold</option><option value="700">Bold</option>
            </select>
          </label>
          <label htmlFor={`${id}-alignment`}>
            <span>Text alignment</span>
            <select id={`${id}-alignment`} value={value.textAlignment} onChange={(event) => onChange({ textAlignment: event.target.value as TemplatePlacement['textAlignment'] })}>
              <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
            </select>
          </label>
          <label htmlFor={`${id}-fit-mode`}>
            <span>Fit mode</span>
            <select id={`${id}-fit-mode`} value={value.fitMode} onChange={(event) => onChange({ fitMode: event.target.value as TemplatePlacement['fitMode'] })}>
              <option value="single_line">Single line</option><option value="wrap">Wrap</option><option value="shrink_to_fit">Shrink to fit</option>
            </select>
          </label>
          <label htmlFor={`${id}-colour`}>
            <span>Text colour</span>
            <input id={`${id}-colour`} value={value.fontColor ?? '#111111'} maxLength={7} pattern="#[0-9A-Fa-f]{6}" onChange={(event) => onChange({ fontColor: event.target.value })} />
          </label>
          {value.fieldKey === 'issue_date' || value.fieldKey === 'completion_date' ? (
            <label htmlFor={`${id}-date-format`}>
              <span>Date format</span>
              <input id={`${id}-date-format`} value={value.dateFormat ?? 'DD.MM.YYYY'} onChange={(event) => onChange({ dateFormat: event.target.value })} />
            </label>
          ) : null}
          {value.fieldKey === 'static_text' ? (
            <label className="field-wide" htmlFor={`${id}-static-text`}>
              <span>Static text</span>
              <textarea id={`${id}-static-text`} value={value.staticText ?? ''} onChange={(event) => onChange({ staticText: event.target.value })} />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="placement-field-actions">
        <label className="template-checkbox" htmlFor={`${id}-required`}>
          <input id={`${id}-required`} type="checkbox" checked={value.isRequired} onChange={(event) => onChange({ isRequired: event.target.checked })} />
          <span>Required field</span>
        </label>
        {!readonly ? <button type="button" onClick={onRemove}>Remove {fieldLabels[value.fieldKey]}</button> : null}
      </div>
    </fieldset>
  );
}
