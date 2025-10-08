import { ReactNode, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    createMicrosoftGraphClientWithCredential,
    ErrorCode,
    ErrorWithCode,
    TeamsUserCredential
} from "@microsoft/teamsfx";

type Profile = {
    displayName: string;
    jobTitle?: string;
    mail?: string;
    mobilePhone?: string;
    photoUrl?: string | null;
};

type StatusMessage = {
    tone: "info" | "error";
    message: string;
};

interface GraphProfileResponse {
    displayName?: string;
    jobTitle?: string;
    mail?: string;
    userPrincipalName?: string;
    mobilePhone?: string;
    businessPhones?: string[];
}

interface GraphProfileResult {
    profile: Profile;
    photoBlob?: Blob;
}

class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

const GRAPH_SCOPES = ["User.Read"];

const FALLBACK_PROFILE: Profile = {
    displayName: "Ivan Doe",
    jobTitle: "Branch Sales Officer",
    mail: "ivan.doe@rakbank.ae",
    mobilePhone: "+971 50 123 4567",
    photoUrl: "/dummy_profile.png"
};

export default function App() {
    const [profile, setProfile] = useState<Profile>({ ...FALLBACK_PROFILE });
    const [photoError, setPhotoError] = useState(false);
    const [cardHovered, setCardHovered] = useState(false);
    const [qrHovered, setQrHovered] = useState(false);
    const [simulateTeams, setSimulateTeams] = useState(true);
    const [dataSource, setDataSource] = useState<"graph" | "fallback">("fallback");
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const photoObjectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            setStatus({ tone: "info", message: "Connecting to Microsoft Entra ID..." });

            try {
                const result = await fetchGraphProfile();
                if (cancelled) {
                    return;
                }

                const nextProfile: Profile = {
                    ...result.profile
                };

                if (photoObjectUrlRef.current) {
                    URL.revokeObjectURL(photoObjectUrlRef.current);
                    photoObjectUrlRef.current = null;
                }

                if (result.photoBlob) {
                    const objectUrl = URL.createObjectURL(result.photoBlob);
                    photoObjectUrlRef.current = objectUrl;
                    nextProfile.photoUrl = objectUrl;
                }

                setProfile(nextProfile);
                setPhotoError(false);
                setDataSource("graph");
                setStatus({ tone: "info", message: "Live profile pulled from Microsoft Entra ID." });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.warn(
                    "Microsoft Entra profile load failed. Falling back to the sample business card.",
                    error
                );

                const statusUpdate = mapErrorToStatus(error);
                setStatus(statusUpdate);

                if (photoObjectUrlRef.current) {
                    URL.revokeObjectURL(photoObjectUrlRef.current);
                    photoObjectUrlRef.current = null;
                }

                setProfile({ ...FALLBACK_PROFILE });
                setPhotoError(false);
                setDataSource("fallback");
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
            if (photoObjectUrlRef.current) {
                URL.revokeObjectURL(photoObjectUrlRef.current);
                photoObjectUrlRef.current = null;
            }
        };
    }, []);

    const vCardString = `BEGIN:VCARD
VERSION:3.0
FN:${profile.displayName}
TITLE:${profile.jobTitle ?? ""}
EMAIL:${profile.mail ?? ""}
TEL:${profile.mobilePhone ?? ""}
END:VCARD`;

    const accentColor = "#E01F26";
    const profileInitial = profile.displayName?.charAt(0)?.toUpperCase() ?? "R";
    const jobTitle = profile.jobTitle?.trim() || "Job title unavailable";
    const email = profile.mail?.trim() || "Email unavailable";
    const mobilePhone = profile.mobilePhone?.trim() || "Mobile number unavailable";

    const styles = {
        card: {
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            fontFamily: "'Aptos', 'Arial', sans-serif",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            position: "relative" as const,
            width: "90%",
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column" as const,
            height: "560px"
        },
        cardHover: {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.25)"
        },
        qr: {
            transition: "transform 0.3s ease-in-out"
        },
        qrHover: {
            transform: "scale(1.1)"
        },
        fadeIn: {
            opacity: 0,
            animation: "fadeIn 0.6s ease-out forwards"
        }
    };

    const card = (
        <div
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => setCardHovered(false)}
            style={{
                ...styles.card,
                ...(cardHovered ? styles.cardHover : {})
            }}
        >
            {/* Red Header */}
            <div style={{
                flex: "0 0 35%",
                backgroundColor: accentColor,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px"
            }}>
                <img
                    src="/rak_logo.png"
                    alt="RAKBANK Logo"
                    style={{ maxWidth: "70%", height: "auto" }}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            </div>

            {/* Profile Photo */}
            <div
                style={{
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    border: "5px solid white",
                    overflow: "hidden",
                    backgroundColor: "#f0f0f0",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    zIndex: 2
                }}
            >
                {profile.photoUrl && !photoError ? (
                    <img
                        src={profile.photoUrl}
                        alt="Profile"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            ...styles.fadeIn
                        }}
                        onError={() => setPhotoError(true)}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "radial-gradient(circle at top, #ffffff 0%, #e9e9e9 100%)",
                            color: accentColor,
                            fontSize: "42px",
                            fontWeight: 600,
                            letterSpacing: "0.02em"
                        }}
                    >
                        {profileInitial}
                    </div>
                )}
            </div>

            {/* Info and QR */}
            <div style={{
                flex: "1",
                padding: "60px 16px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}>
                <div>
                    <h2 style={{ margin: "10px 0", fontSize: "20px", color: "#333333" }}>
                        {profile.displayName}
                    </h2>
                    <p style={{ margin: "5px 0", fontSize: "16px", color: "#666666" }}>
                        {jobTitle}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px", color: "#666666" }}>
                        {email}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px", color: "#666666" }}>
                        {mobilePhone}
                    </p>
                </div>

                <div
                    onMouseEnter={() => setQrHovered(true)}
                    onMouseLeave={() => setQrHovered(false)}
                    style={{
                        marginTop: "20px",
                        ...styles.qr,
                        ...(qrHovered ? styles.qrHover : {})
                    }}
                >
                    <QRCodeSVG
                        value={vCardString}
                        size={120}
                        fgColor={accentColor}
                        bgColor="#FFFFFF"
                    />
                    <p style={{ marginTop: "10px", fontSize: "12px", color: "#999999" }}>
                        Scan to save contact
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <style>
                {`@keyframes fadeIn { to { opacity: 1; } }`}
            </style>

            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: simulateTeams ? "#121212" : "#f4f4f4",
                    padding: "32px 16px"
                }}
            >
                <div
                    style={{
                        maxWidth: "960px",
                        margin: "0 auto 24px",
                        backgroundColor: simulateTeams ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                        color: simulateTeams ? "#f5f5f5" : "#333333",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        boxShadow: simulateTeams
                            ? "0 10px 30px rgba(0,0,0,0.35)"
                            : "0 8px 24px rgba(0,0,0,0.12)",
                        border: simulateTeams ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e5e5"
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                            <label htmlFor="simulateToggle" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    id="simulateToggle"
                                    type="checkbox"
                                    checked={simulateTeams}
                                    onChange={(event) => setSimulateTeams(event.target.checked)}
                                    style={{ width: "18px", height: "18px" }}
                                />
                                <span style={{ fontWeight: 600 }}>Simulate Microsoft Teams host</span>
                            </label>
                            <p style={{ margin: 0, fontSize: "14px", opacity: 0.85 }}>
                                Toggle the switch to wrap the card in a lightweight Teams-like shell for demos and user
                                testing.
                            </p>
                        </div>

                        <div
                            style={{
                                padding: "12px 16px",
                                borderRadius: "10px",
                                backgroundColor: simulateTeams ? "rgba(255, 255, 255, 0.05)" : "#f4f7ff",
                                border:
                                    status?.tone === "error"
                                        ? `1px solid ${accentColor}`
                                        : simulateTeams
                                            ? "1px solid rgba(255,255,255,0.12)"
                                            : "1px solid #d4e2ff",
                                color: simulateTeams ? "#f5f5f5" : "#333333"
                            }}
                        >
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                                Profile source: {dataSource === "graph" ? "Microsoft Entra ID" : "Sample placeholder"}
                            </p>
                            {status && (
                                <p
                                    style={{
                                        margin: "6px 0 0",
                                        fontSize: "13px",
                                        lineHeight: 1.4,
                                        color:
                                            status.tone === "error"
                                                ? accentColor
                                                : simulateTeams
                                                    ? "#d5eaff"
                                                    : "#0b5394"
                                    }}
                                >
                                    {status.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {simulateTeams ? (
                    <TeamsHost accentColor={accentColor}>{card}</TeamsHost>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: "70vh"
                        }}
                    >
                        {card}
                    </div>
                )}
            </div>
        </>
    );
}

function mapErrorToStatus(error: unknown): StatusMessage {
    if (error instanceof ConfigurationError) {
        return {
            tone: "info",
            message:
                "Set REACT_APP_CLIENT_ID and REACT_APP_START_LOGIN_PAGE_URL to enable Microsoft Entra integration. Sample details are shown instead."
        };
    }

    if (error instanceof ErrorWithCode) {
        switch (error.code) {
            case ErrorCode.RuntimeNotSupported:
                return {
                    tone: "info",
                    message:
                        "Microsoft Teams SSO is not available in this host. Open the tab inside Teams or use the Teams Toolkit preview to load live data."
                };
            case ErrorCode.FailedToRetrieveSsoToken:
                return {
                    tone: "info",
                    message:
                        "Teams could not provide an SSO token. Try signing in with the popup or run the experience inside Microsoft Teams."
                };
            case ErrorCode.UiRequiredError:
                return {
                    tone: "info",
                    message: "Interactive sign-in is required. Refresh and sign in to see your Microsoft Entra details."
                };
            case ErrorCode.ConsentFailed:
                return {
                    tone: "info",
                    message:
                        "Permission consent was declined. Approve the Microsoft Graph permission to show live contact details."
                };
            default:
                return {
                    tone: "error",
                    message: `Microsoft Entra sign-in failed: ${error.message}`
                };
        }
    }

    if (error instanceof Error) {
        return {
            tone: "error",
            message: error.message
        };
    }

    return {
        tone: "error",
        message: "Unable to load Microsoft Entra profile."
    };
}

async function fetchGraphProfile(): Promise<GraphProfileResult> {
    const clientId = process.env.REACT_APP_CLIENT_ID;
    const loginEndpoint = process.env.REACT_APP_START_LOGIN_PAGE_URL;

    if (!clientId || !loginEndpoint) {
        throw new ConfigurationError(
            "Microsoft Entra connection is not configured. Provide REACT_APP_CLIENT_ID and REACT_APP_START_LOGIN_PAGE_URL."
        );
    }

    const credential = new TeamsUserCredential({
        clientId,
        initiateLoginEndpoint: loginEndpoint
    });

    await credential.login(GRAPH_SCOPES);

    const graphClient = createMicrosoftGraphClientWithCredential(credential, GRAPH_SCOPES);
    const graphProfile = (await graphClient
        .api("/me")
        .select("displayName,jobTitle,mail,mobilePhone,userPrincipalName,businessPhones")
        .get()) as GraphProfileResponse;

    const profile: Profile = mapGraphProfile(graphProfile);

    let photoBlob: Blob | undefined;
    try {
        const token = await credential.getToken(GRAPH_SCOPES);
        if (token?.token) {
            const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
                headers: {
                    Authorization: `Bearer ${token.token}`
                }
            });

            if (response.ok) {
                photoBlob = await response.blob();
            } else if (response.status !== 404) {
                throw new Error(`Graph photo request failed with status ${response.status}`);
            }
        }
    } catch (photoError) {
        console.warn("Unable to load profile photo from Microsoft Graph.", photoError);
    }

    return { profile, photoBlob };
}

function mapGraphProfile(graphProfile: GraphProfileResponse): Profile {
    const mail = (graphProfile.mail || graphProfile.userPrincipalName || "").trim();
    const mobile = (
        graphProfile.mobilePhone ||
        (Array.isArray(graphProfile.businessPhones)
            ? graphProfile.businessPhones.find((phone) => Boolean(phone))
            : "") ||
        ""
    ).trim();

    return {
        displayName: graphProfile.displayName || FALLBACK_PROFILE.displayName,
        jobTitle: graphProfile.jobTitle?.trim(),
        mail,
        mobilePhone: mobile
    };
}

function TeamsHost({ children, accentColor }: { children: ReactNode; accentColor: string }) {
    const navigationItems = [
        { label: "Overview", active: false },
        { label: "Business Card", active: true },
        { label: "Files", active: false },
        { label: "Activities", active: false }
    ];

    return (
        <div
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                backgroundColor: "#1f1f1f",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.08)"
            }}
        >
            <header
                style={{
                    backgroundColor: "#2b2b2b",
                    color: "#f5f5f5",
                    padding: "18px 32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}
            >
                <div>
                    <p style={{ margin: 0, fontSize: "14px", opacity: 0.75 }}>RAKBANK</p>
                    <h1 style={{ margin: "4px 0 0", fontSize: "22px" }}>Relationship Workspace</h1>
                </div>
                <span
                    style={{
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        border: `1px solid rgba(255,255,255,0.2)`
                    }}
                >
                    Simulated view
                </span>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "520px" }}>
                <aside
                    style={{
                        backgroundColor: "#252525",
                        padding: "24px 20px",
                        borderRight: "1px solid rgba(255,255,255,0.06)"
                    }}
                >
                    <p style={{ color: "#d8d8d8", margin: "0 0 16px", fontSize: "14px", textTransform: "uppercase" }}>
                        Navigation
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                        {navigationItems.map((item) => (
                            <li
                                key={item.label}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    backgroundColor: item.active ? accentColor : "transparent",
                                    color: item.active ? "#ffffff" : "#d0d0d0",
                                    fontSize: "14px",
                                    fontWeight: item.active ? 600 : 500,
                                    boxShadow: item.active ? "0 6px 16px rgba(0,0,0,0.28)" : undefined
                                }}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </aside>
                <main
                    style={{
                        backgroundColor: "#f4f4f4",
                        padding: "48px 40px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start"
                    }}
                >
                    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>{children}</div>
                </main>
            </div>
        </div>
    );
}
