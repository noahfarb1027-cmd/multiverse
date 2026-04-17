import { createLeague, joinLeague } from '@/app/actions/leagues'
import { Users, Plus } from 'lucide-react'

export default function NewLeaguePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Join or Create a League</h1>
        <p className="text-slate-400 text-sm mt-1">Get started in under 2 minutes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        {/* Create */}
        <div className="card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand-light mb-4">
            <Plus size={20} />
          </div>
          <h2 className="font-semibold text-white text-lg mb-1">Create a League</h2>
          <p className="text-slate-400 text-sm mb-6">You&apos;ll be the commissioner and can invite friends.</p>

          <form action={createLeague} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">League Name</label>
              <input className="input" name="name" placeholder="Monday Night Managers" required />
            </div>
            <div>
              <label className="section-label block mb-1.5">Your Team Name</label>
              <input className="input" name="team_name" placeholder="The Underdogs" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label block mb-1.5">Teams</label>
                <input className="input" name="team_count" type="number" defaultValue={10} min={2} max={20} />
              </div>
              <div>
                <label className="section-label block mb-1.5">Draft Rounds</label>
                <input className="input" name="draft_pick_count" type="number" defaultValue={15} min={5} max={25} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">Create League</button>
          </form>
        </div>

        {/* Join */}
        <div className="card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 mb-4">
            <Users size={20} />
          </div>
          <h2 className="font-semibold text-white text-lg mb-1">Join a League</h2>
          <p className="text-slate-400 text-sm mb-6">Enter an invite code shared by your commissioner.</p>

          <form action={joinLeague} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">Invite Code</label>
              <input className="input font-mono" name="invite_code" placeholder="a3f9b2c1" required />
            </div>
            <div>
              <label className="section-label block mb-1.5">Your Team Name</label>
              <input className="input" name="team_name" placeholder="The Underdogs" required />
            </div>
            <button type="submit" className="btn-primary w-full bg-emerald-500 hover:bg-emerald-600">Join League</button>
          </form>
        </div>
      </div>
    </div>
  )
}
