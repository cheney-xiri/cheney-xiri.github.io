import {getStore} from '@netlify/blobs';
import {createInteractionGateway} from '../../../server/interaction-gateway.mjs';

export default async(request,context)=>{
 const store=getStore({name:'cheney-interaction',consistency:'strong'});
 const kv={
  get:(key,options={})=>store.get(key,{type:options.type||'text',consistency:'strong'}),
  put:(key,value)=>store.set(key,value),
  delete:key=>store.delete(key),
  list:async({prefix})=>{const {blobs}=await store.list({prefix});return {keys:blobs.map(x=>({name:x.key})),complete:true};}
 };
 const handler=createInteractionGateway(kv,process.env.CHENEY_INBOX_PASSWORD);
 return handler(request,{clientIp:context.ip||'anonymous'});
};
export const config={path:'/api/*'};
