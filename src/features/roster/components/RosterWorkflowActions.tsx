import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRosterReviewAction } from '../api';
import type { Roster } from '../types';
import { toast } from 'sonner';

type Props={roster:Pick<Roster,'id'|'canSubmit'|'canPublish'|'canReturn'>;onPublish:()=>void;publishing:boolean};
export function RosterWorkflowActions({roster,onPublish,publishing}:Props){
 const [comment,setComment]=useState('');const review=useRosterReviewAction();
 const submit=()=>review.mutate({id:roster.id,action:'submit'},{onSuccess:()=>toast.success('Submitted for HOU review'),onError:(e:any)=>toast.error(e.message||'Could not submit roster')});
 const sendBack=()=>review.mutate({id:roster.id,action:'return',comment},{onSuccess:()=>{setComment('');toast.success('Returned to draft')},onError:(e:any)=>toast.error(e.message||'Could not return roster')});
 return <div className="flex flex-wrap items-center gap-2">{roster.canSubmit&&<Button disabled={review.isPending} onClick={submit}>Submit for review</Button>}{roster.canPublish&&<Button disabled={publishing} onClick={onPublish}>Publish Roster</Button>}{roster.canReturn&&<><input aria-label="Return comment" maxLength={2000} className="rounded border bg-background p-2" placeholder="Changes required" value={comment} onChange={e=>setComment(e.target.value)}/><Button variant="outline" disabled={!comment.trim()||review.isPending} onClick={sendBack}>Return to draft</Button></>}</div>;
}
