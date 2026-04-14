import React, { useState, useRef } from 'react';

const Profile = () => {
    const [nickname] = useState("Likelion#1253");
    const [bio, setBio] = useState("");
    const [song, setSong] = useState("");
    
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [profileImageUrl] = useState(null);
    
    const profileImg = null;

    const fileInputRef = useRef(null);

    const handledClickEditIcon = () => {
        fileInputRef.current?.click();
    };

    const handledFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImageFile(file);

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handledSave = () => {
        console.log("데이터:", {
            nickname,
            bio,
            song,
            selectedImageFile
        });
        alert(`프로필이 저장되었습니다!\n한 줄 소개: ${bio}\n좋아하는 노래: ${song}`);
    };

    const displayImageSrc = previewUrl || profileImageUrl || profileImg;

    return (
        <section className="profile-section">
            <div className="profile-header-row">
                <div className="profile-left-content">
                    <div className="profile-image-container">
                        {displayImageSrc ? (
                            <img src={displayImageSrc} alt="프로필" className="profile-img" />
                        ) : (
                            <div className="profile-img-placeholder" />
                        )}
                        <div className="edit-icon" onClick={handledClickEditIcon}>
                            ✎
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handledFileChange} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                        />
                    </div>
                    <div className="profile-info-main">
                        <div className="profile-nickname">{nickname}</div>
                    </div>
                </div>
                <button className="save-btn" onClick={handledSave}>
                    프로필 저장
                </button>
            </div>

            <div className="profile-inputs">
                <div className="input-group">
                    <label>한 줄 소개</label>
                    <input 
                        type="text" 
                        placeholder="안녕하세요" 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>좋아하는 노래</label>
                    <div className="song-search-wrapper">
                        <span className="music-note">♫</span>
                        <input 
                            type="text" 
                            placeholder="내꺼하자 - 인피니트" 
                            value={song}
                            onChange={(e) => setSong(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Profile;
