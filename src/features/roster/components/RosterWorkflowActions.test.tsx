// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const {mutate}=vi.hoisted(()=>({mutate:vi.fn()}));
vi.mock('../api',()=>({useRosterReviewAction:()=>({mutate,isPending:false})}));
vi.mock('sonner',()=>({toast:{success:vi.fn(),error:vi.fn()}}));
import {RosterWorkflowActions} from './RosterWorkflowActions';
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('offers terminal heads submission without a publish action',()=>{render(<RosterWorkflowActions roster={{id:'r',canSubmit:true,canPublish:false,canReturn:false}} onPublish={vi.fn()} publishing={false}/>);expect(screen.queryByRole('button',{name:'Publish Roster'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Submit for review'}));expect(mutate).toHaveBeenCalledWith({id:'r',action:'submit'},expect.anything());});
it('requires a comment when an HOU returns a submitted roster',()=>{const publish=vi.fn();render(<RosterWorkflowActions roster={{id:'r',canSubmit:false,canPublish:true,canReturn:true}} onPublish={publish} publishing={false}/>);expect(screen.queryByRole('button',{name:'Submit for review'})).toBeNull();const button=screen.getByRole('button',{name:'Return to draft'}) as HTMLButtonElement;expect(button.disabled).toBe(true);fireEvent.change(screen.getByLabelText('Return comment'),{target:{value:'Fix the weekend coverage'}});fireEvent.click(button);expect(mutate).toHaveBeenCalledWith({id:'r',action:'return',comment:'Fix the weekend coverage'},expect.anything());fireEvent.click(screen.getByRole('button',{name:'Publish Roster'}));expect(publish).toHaveBeenCalledOnce();});
