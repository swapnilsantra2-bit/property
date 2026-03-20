"use client";

import { useState, useCallback } from "react";
import {
  registerProperty,
  transferProperty,
  getProperty,
  getAllProperties,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Truncate helper ──────────────────────────────────────────

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── Main Component ───────────────────────────────────────────

type Tab = "lookup" | "register" | "transfer";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lookup");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Register state
  const [regId, setRegId] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Transfer state
  const [transferId, setTransferId] = useState("");
  const [transferNewOwner, setTransferNewOwner] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Lookup state
  const [lookupId, setLookupId] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [propertyData, setPropertyData] = useState<Record<string, string> | null>(null);

  // All properties state
  const [allPropertyIds, setAllPropertyIds] = useState<string[] | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!regId.trim() || !regLocation.trim() || !regDescription.trim())
      return setError("Fill in all fields");
    setError(null);
    setIsRegistering(true);
    setTxStatus("Awaiting signature...");
    try {
      await registerProperty(walletAddress, regId.trim(), regLocation.trim(), regDescription.trim());
      setTxStatus("Property registered on-chain!");
      setRegId("");
      setRegLocation("");
      setRegDescription("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsRegistering(false);
    }
  }, [walletAddress, regId, regLocation, regDescription]);

  const handleTransfer = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!transferId.trim() || !transferNewOwner.trim())
      return setError("Fill in all fields");
    setError(null);
    setIsTransferring(true);
    setTxStatus("Awaiting signature...");
    try {
      await transferProperty(walletAddress, transferId.trim(), transferNewOwner.trim());
      setTxStatus("Property transferred!");
      setTransferId("");
      setTransferNewOwner("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsTransferring(false);
    }
  }, [walletAddress, transferId, transferNewOwner]);

  const handleLookup = useCallback(async () => {
    if (!lookupId.trim()) return setError("Enter a property ID");
    setError(null);
    setIsLookingUp(true);
    setPropertyData(null);
    try {
      const result = await getProperty(lookupId.trim(), walletAddress || undefined);
      if (result && typeof result === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(result)) {
          mapped[String(k)] = String(v);
        }
        setPropertyData(mapped);
      } else {
        setError("Property not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLookingUp(false);
    }
  }, [lookupId, walletAddress]);

  const handleLoadAll = useCallback(async () => {
    setIsLoadingAll(true);
    setError(null);
    try {
      const result = await getAllProperties(walletAddress || undefined);
      if (result && Array.isArray(result)) {
        setAllPropertyIds(result.map(String));
      } else {
        setAllPropertyIds([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingAll(false);
    }
  }, [walletAddress]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "lookup", label: "Lookup", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "register", label: "Register", icon: <PlusIcon />, color: "#7c6cf0" },
    { key: "transfer", label: "Transfer", icon: <ArrowRightIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("transferred") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <HomeIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Property Registry</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setPropertyData(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Lookup */}
            {activeTab === "lookup" && (
              <div className="space-y-5">
                <MethodSignature name="get_property" params="(property_id: String)" returns="-> Property" color="#4fc3f7" />
                <Input label="Property ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="e.g. LAND-001" />
                <ShimmerButton onClick={handleLookup} disabled={isLookingUp} shimmerColor="#4fc3f7" className="w-full">
                  {isLookingUp ? <><SpinnerIcon /> Querying...</> : <><SearchIcon /> Lookup Property</>}
                </ShimmerButton>

                {/* Lookup result */}
                {propertyData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Property Details</span>
                      <Badge variant="success">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                        Registered
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Property ID</span>
                        <span className="font-mono text-sm text-white/80">{lookupId}</span>
                      </div>
                      {Object.entries(propertyData).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-white/35 capitalize">{key}</span>
                          <span className="font-mono text-sm text-white/80 break-all text-right max-w-[60%]">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All properties list */}
                <div className="pt-2">
                  <button
                    onClick={handleLoadAll}
                    disabled={isLoadingAll}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
                  >
                    {isLoadingAll ? <SpinnerIcon /> : <ListIcon />}
                    {allPropertyIds ? `${allPropertyIds.length} properties found` : "Load all property IDs"}
                  </button>
                  {allPropertyIds && allPropertyIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {allPropertyIds.map((id) => (
                        <button
                          key={id}
                          onClick={() => { setLookupId(id); setPropertyData(null); }}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-white/50 hover:border-[#4fc3f7]/20 hover:text-[#4fc3f7]/80 transition-all"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Register */}
            {activeTab === "register" && (
              <div className="space-y-5">
                <MethodSignature name="register" params="(property_id: String, location: String, description: String)" color="#7c6cf0" />
                <p className="text-xs text-white/25 -mt-2">
                  Permissionless — anyone can register. Caller becomes the owner.
                </p>
                <Input label="Property ID" value={regId} onChange={(e) => setRegId(e.target.value)} placeholder="e.g. LAND-001" />
                <Input label="Location" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} placeholder="e.g. 123 Blockchain Ave, Lagos" />
                <Input label="Description" value={regDescription} onChange={(e) => setRegDescription(e.target.value)} placeholder="e.g. 2-bedroom apartment, 85 sqm" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleRegister} disabled={isRegistering} shimmerColor="#7c6cf0" className="w-full">
                    {isRegistering ? <><SpinnerIcon /> Registering...</> : <><HomeIcon /> Register Property</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to register properties
                  </button>
                )}
              </div>
            )}

            {/* Transfer */}
            {activeTab === "transfer" && (
              <div className="space-y-5">
                <MethodSignature name="transfer" params="(property_id: String, new_owner: Address)" color="#fbbf24" />
                <p className="text-xs text-white/25 -mt-2">
                  Only the current owner can transfer (requires their wallet signature).
                </p>
                <Input label="Property ID" value={transferId} onChange={(e) => setTransferId(e.target.value)} placeholder="e.g. LAND-001" />
                <Input label="New Owner Address" value={transferNewOwner} onChange={(e) => setTransferNewOwner(e.target.value)} placeholder="e.g. G..." />
                {walletAddress ? (
                  <ShimmerButton onClick={handleTransfer} disabled={isTransferring} shimmerColor="#fbbf24" className="w-full">
                    {isTransferring ? <><SpinnerIcon /> Transferring...</> : <><ArrowRightIcon /> Transfer Ownership</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to transfer properties
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Property Registry &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#7c6cf0]" />
                <span className="font-mono text-[9px] text-white/15">Permissionless</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
