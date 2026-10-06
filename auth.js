const sb = window.supabase.createClient(window.BLP_SUPABASE_URL, window.BLP_SUPABASE_KEY);
const accountBtn = document.querySelector('#accountBtn');
const authModal = document.querySelector('#authModal');
const closeAuth = document.querySelector('#closeAuth');
const authTitle = document.querySelector('#authTitle');
const authMessage = document.querySelector('#authMessage');
const signupFields = document.querySelector('#signupFields');
const authForm = document.querySelector('#authForm');
const switchAuth = document.querySelector('#switchAuth');
const logoutBtn = document.querySelector('#logoutBtn');
let mode = 'signup';

function showMessage(text, error=false){ authMessage.textContent=text; authMessage.className='auth-message '+(error?'error':'ok'); }
function setMode(next){
  mode=next; authTitle.textContent=mode==='signup'?'Create your BLP account':'Log in to BLP Games';
  signupFields.hidden=mode!=='signup';
  document.querySelector('#submitAuth').textContent=mode==='signup'?'Create Account':'Log In';
  switchAuth.textContent=mode==='signup'?'Already have an account? Log in':'Need an account? Sign up';
  showMessage('');
}
accountBtn.onclick=()=>{ authModal.showModal(); setMode('signup'); };
closeAuth.onclick=()=>authModal.close();
switchAuth.onclick=()=>setMode(mode==='signup'?'login':'signup');
authModal.addEventListener('click',e=>{ if(e.target===authModal) authModal.close(); });

async function refreshAccount(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user){ accountBtn.textContent='Create Account'; logoutBtn.hidden=true; return; }
  const {data:profile}=await sb.from('profiles').select('username').eq('id',user.id).maybeSingle();
  accountBtn.textContent=profile?.username || user.email.split('@')[0];
  logoutBtn.hidden=false;
}

authForm.onsubmit=async e=>{
  e.preventDefault(); showMessage('Working...');
  const email=document.querySelector('#authEmail').value.trim();
  const password=document.querySelector('#authPassword').value;
  if(mode==='signup'){
    const username=document.querySelector('#authUsername').value.trim();
    if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){ showMessage('Username must be 3–20 characters using letters, numbers, or _.',true); return; }
    const {data:existing}=await sb.from('profiles').select('username').ilike('username',username).maybeSingle();
    if(existing){ showMessage('That username is already taken.',true); return; }
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{username}}});
    if(error){ showMessage(error.message,true); return; }
    if(data.session){ showMessage('Account created! You are logged in.'); setTimeout(()=>authModal.close(),700); }
    else showMessage('Account created. Check your email to confirm it, then log in.');
  } else {
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){ showMessage(error.message,true); return; }
    showMessage('Logged in!'); setTimeout(()=>authModal.close(),500);
  }
  await refreshAccount();
};
logoutBtn.onclick=async()=>{ await sb.auth.signOut(); await refreshAccount(); };
sb.auth.onAuthStateChange(()=>setTimeout(refreshAccount,0));
refreshAccount();
