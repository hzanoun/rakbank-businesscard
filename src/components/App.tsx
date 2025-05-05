import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@fluentui/react-components";

export default function App() {
    const [profile, setProfile] = useState<any>(null);
    const [photoError, setPhotoError] = useState(false);
    const [cardHovered, setCardHovered] = useState(false);
    const [qrHovered, setQrHovered] = useState(false);

    useEffect(() => {
        const dummyUser = {
            displayName: "Ivan Doe",
            jobTitle: "Branch Sales Officer",
            mail: "ivan.doe@rakbank.ae",
            mobilePhone: "+971 50 123 4567",
            photoUrl: "/dummy_profile.png" // make sure this exists in public
        };
        setProfile(dummyUser);
    }, []);

    if (!profile) return <div style={{ padding: 20 }}>Loading...</div>;

    const vCardString = `BEGIN:VCARD
VERSION:3.0
FN:${profile.displayName}
TITLE:${profile.jobTitle}
EMAIL:${profile.mail}
TEL:${profile.mobilePhone}
END:VCARD`;

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

    return (
        <>
            <style>
                {`@keyframes fadeIn { to { opacity: 1; } }`}
            </style>

            <div style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f4f4f4",
                padding: "20px"
            }}>
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
                        backgroundColor: "#E01F26",
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
                    {!photoError && profile.photoUrl && (
                        <div style={{
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
                        }}>
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
                        </div>
                    )}

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
                                {profile.jobTitle}
                            </p>
                            <p style={{ margin: "5px 0", fontSize: "14px", color: "#666666" }}>
                                {profile.mail}
                            </p>
                            <p style={{ margin: "5px 0", fontSize: "14px", color: "#666666" }}>
                                {profile.mobilePhone}
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
                                fgColor="#E01F26"
                                bgColor="#FFFFFF"
                            />
                            <p style={{ marginTop: "10px", fontSize: "12px", color: "#999999" }}>
                                Scan to save contact
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
