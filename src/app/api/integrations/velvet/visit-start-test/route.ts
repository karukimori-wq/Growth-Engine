import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const payload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  customerId: "customer_test_001",
  reservationId: "reservation_test_001",
  intent: "start_professional_visit"
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Trace-Id, X-Correlation-Id, X-Source-App"
};

export async function OPTIONS() { return new NextResponse(null,{status:204,headers:corsHeaders}); }

export async function POST(request: NextRequest) {
  const traceId=request.headers.get("X-Trace-Id")??`trace_${randomUUID().replace(/-/g,"")}`;
  const correlationId=request.headers.get("X-Correlation-Id")??`corr_${randomUUID().replace(/-/g,"")}`;
  const requestId=`req_${randomUUID().replace(/-/g,"")}`;
  const baseUrl=(process.env.VELVET_BASE_URL??"").replace(/\/$/,"");
  if(!baseUrl){
    return NextResponse.json({appName,status:"skipped",integration:"velvet",operation:"VelvetHandoff.Start",reason:"VELVET_BASE_URL_NOT_CONFIGURED",traceId,correlationId,requestId,timestamp:getTimestamp()},{headers:corsHeaders});
  }
  const endpoint=`${baseUrl}/api/visits`;
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json","X-Trace-Id":traceId,"X-Correlation-Id":correlationId,"X-Source-App":"growth-engine"},body:JSON.stringify(payload),cache:"no-store"});
    const body=await response.json().catch(()=>null) as Record<string,unknown>|null;
    const passed=response.ok&&body?.status==="success"&&typeof body?.visitId==="string"&&body?.eventName==="velvet.visit.started.v1";
    return NextResponse.json({
      appName,
      status:passed?"success":"error",
      integration:"velvet",
      operation:"VelvetHandoff.Start",
      endpoint,
      velvetStatusCode:response.status,
      visitId:body?.visitId??null,
      eventName:body?.eventName??null,
      traceId:body?.traceId??traceId,
      correlationId:body?.correlationId??correlationId,
      requestId:body?.requestId??requestId,
      dataSafety:{customerMasterSent:false,paymentStatusSent:false,salesAmountSent:false,stripeDataSent:false,fullProfessionalNotesSent:false},
      timestamp:getTimestamp()
    },{headers:corsHeaders});
  }catch(error){
    return NextResponse.json({appName,status:"error",integration:"velvet",operation:"VelvetHandoff.Start",endpoint,error:{code:"UPSTREAM_UNAVAILABLE",message:error instanceof Error?error.message:"Velvet request failed"},traceId,correlationId,requestId,timestamp:getTimestamp()},{headers:corsHeaders});
  }
}
