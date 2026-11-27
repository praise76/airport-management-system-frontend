import { useEffect, useState } from 'react';
import { getRenewalLetter } from '@/api/stakeholder-renewals';

export function RenewalLetter({ path, label = 'request letter' }: { path: string; label?: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return <span className="text-sm">{url ? <a href={url} target="_blank" rel="noreferrer" className="underline">Open {label}</a> : <button type="button" className="underline" onClick={async () => { try { setUrl(URL.createObjectURL(await getRenewalLetter(path))); setError(''); } catch { setError(`Could not load the ${label}.`); } }}>Load {label}</button>}{error && <span role="alert" className="ml-2 text-red-500">{error}</span>}</span>;
}
