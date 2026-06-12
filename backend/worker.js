const json=(data,status=200,origin='*')=>new Response(JSON.stringify(data),{
  status,
  headers:{
    'Content-Type':'application/json;charset=UTF-8',
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'POST,OPTIONS'
  }
});

function orderText(order,admin=false){
  const lines=[
    admin?'【新規注文】たかひろ珈琲':'たかひろ珈琲 ご注文ありがとうございます',
    `注文番号: ${order.number}`,
    `受取方法: ${order.delivery}`,
    `決済方法: ${order.payment}`,
    `商品: ${order.product}`,
    `合計: ¥${Number(order.amount).toLocaleString('ja-JP')}`
  ];
  if(admin){
    lines.push(`お名前: ${order.name||'-'}`);
    if(order.postal)lines.push(`配送先: 〒${order.postal} ${order.address||''}`);
  }
  lines.push('こちらはテスト注文です。');
  return lines.join('\n')
}

async function verifyIdToken(idToken,channelId){
  const body=new URLSearchParams({id_token:idToken,client_id:channelId});
  const response=await fetch('https://api.line.me/oauth2/v2.1/verify',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body
  });
  if(!response.ok)throw new Error('Invalid ID token');
  return response.json()
}

async function pushMessage(to,text,token){
  const response=await fetch('https://api.line.me/v2/bot/message/push',{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({to,messages:[{type:'text',text}]})
  });
  if(!response.ok)throw new Error(`LINE push failed: ${response.status}`)
}

export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'https://tak4580.github.io';
    if(origin&&origin!==allowed)return json({error:'Origin not allowed'},403,allowed);
    if(request.method==='OPTIONS')return json({},204,allowed);
    const url=new URL(request.url);
    if(request.method!=='POST'||url.pathname!=='/orders')return json({error:'Not found'},404,allowed);

    try{
      const {idToken,order}=await request.json();
      if(!idToken||!order?.number||!order?.product||!Number.isFinite(Number(order.amount))){
        return json({error:'Invalid order'},400,allowed)
      }
      const profile=await verifyIdToken(idToken,env.LINE_LOGIN_CHANNEL_ID);
      await pushMessage(profile.sub,orderText(order),env.LINE_CHANNEL_ACCESS_TOKEN);
      if(env.LINE_ADMIN_USER_ID){
        await pushMessage(env.LINE_ADMIN_USER_ID,orderText(order,true),env.LINE_CHANNEL_ACCESS_TOKEN)
      }
      return json({ok:true},200,allowed)
    }catch(error){
      console.error(error);
      return json({error:'Notification failed'},500,allowed)
    }
  }
};
