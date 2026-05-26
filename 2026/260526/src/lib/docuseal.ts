export interface DocusealSubmissionResult {
  id: string | number;
  submitters?: Array<{ email: string; embed_src?: string; status?: string }>;
}

export async function createDocusealSubmission(params: {
  templateId: string;
  email: string;
  name: string;
  fields?: Record<string, string>;
}): Promise<DocusealSubmissionResult> {
  const baseUrl = (process.env.DOCUSEAL_BASE_URL || '').replace(/\/$/, '');
  const apiToken = process.env.DOCUSEAL_API_TOKEN;

  if (!baseUrl || !apiToken) {
    throw new Error('DOCUSEAL_BASE_URL und DOCUSEAL_API_TOKEN müssen gesetzt sein');
  }

  const submitters = [
    {
      role: process.env.DOCUSEAL_SIGNER_ROLE || 'Signer',
      email: params.email,
      name: params.name,
      fields: params.fields
        ? Object.entries(params.fields).map(([name, value]) => ({ name, default_value: value }))
        : undefined,
    },
  ];

  const res = await fetch(`${baseUrl}/api/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': apiToken,
    },
    body: JSON.stringify({
      template_id: parseInt(params.templateId, 10) || params.templateId,
      send_email: true,
      submitters,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSeal Fehler: ${res.status} ${text}`);
  }

  return res.json() as Promise<DocusealSubmissionResult>;
}
