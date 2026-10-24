process.env.MONGO_URI='mongodb://x/x';process.env.JWT_ACCESS_SECRET='a';process.env.JWT_REFRESH_SECRET='b';
const path=require('path');
const root=require('path').join(__dirname,'..','src')+'/';
// Fake in-memory User with the SAME atomic semantics MongoDB gives findOneAndUpdate
// (match + $pull happen as one indivisible step).
const db={ id:'u1', refreshTokens:[], role:'student', name:'T', isActive:true, _id:{toString:()=>'u1'} };
const doc=()=>{ const d={...db,_id:db._id, save:async function(){ db.refreshTokens=[...this.refreshTokens]; return this; }}; d.refreshTokens=[...db.refreshTokens]; return d; };
const User={
  findOneAndUpdate:(filter,update)=>({select:async()=>{
    if(filter.refreshTokens && db.refreshTokens.includes(filter.refreshTokens)){ db.refreshTokens=db.refreshTokens.filter(t=>t!==update.$pull.refreshTokens); return doc(); }
    return null;
  }}),
};
require.cache[require.resolve(root+'models/User.js')]={id:'x',filename:'x',loaded:true,exports:User};
const svc=require(root+'modules/auth/auth.service.js');
const {generateRefreshToken,hashToken}=require(root+'utils/tokens.js');
(async()=>{
  const rt=generateRefreshToken({_id:{toString:()=>'u1'}});
  db.refreshTokens=[hashToken(rt)];
  const results=await Promise.allSettled([svc.refreshAccessToken(rt),svc.refreshAccessToken(rt)]);
  const ok=results.filter(r=>r.status==='fulfilled'), bad=results.filter(r=>r.status==='rejected');
  console.log('two concurrent refreshes with the SAME token -> succeeded:',ok.length,'| rejected:',bad.length,'(expect 1 / 1)');
  console.log('tokens left in DB:',db.refreshTokens.length,'(expect exactly 1: the new one)');
  const again=await svc.refreshAccessToken(rt).then(()=>'accepted').catch(e=>'rejected '+e.statusCode);
  console.log('replaying the old token afterwards ->',again,'(expect rejected 401)');
  // Sequential happy path: the NEW token must still work (this is the real reload flow)
  const fresh=ok[0].value.refreshToken;
  const next=await svc.refreshAccessToken(fresh).then(()=>'accepted').catch(e=>'rejected '+e.statusCode);
  console.log('using the rotated token on the next reload ->',next,'(expect accepted)');
})();
