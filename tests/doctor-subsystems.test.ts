import { describe, it, expect } from "vitest";
import { runSubsystemDoctors, type SubsystemExecutor } from "../src/doctor/subsystems";
const fixed = (byBin: Record<string,{status:number|"timeout"|null;output?:string}>): SubsystemExecutor => bin => ({...byBin[bin]??{status:null},output:byBin[bin]?.output??""});
describe("subsystem diagnostics",()=>{
 it("reports each remaining subsystem independently",()=>{const r=runSubsystemDoctors("/tmp/x",fixed({"context-mode":{status:1,output:"broken"},skills:{status:0},"code-review-graph":{status:null}}));const by=Object.fromEntries(r.map(x=>[x.name,x]));expect(r).toHaveLength(3);expect(by["context-mode"]?.status).toBe("FAIL");expect(by.skills?.status).toBe("OK");expect(by["code-review-graph"]?.status).toBe("ABSENT");});
 it("a timeout does not stop the other diagnostics",()=>{const r=runSubsystemDoctors("/tmp/x",fixed({"context-mode":{status:"timeout"},skills:{status:0},"code-review-graph":{status:0}}));expect(r).toHaveLength(3);expect(r[0]?.status).toBe("FAIL");expect(r.slice(1).every(x=>x.status==="OK")).toBe(true);});
});
