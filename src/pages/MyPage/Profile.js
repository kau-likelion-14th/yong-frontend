import React, { useRef, useState, useEffect } from "react";
import { get } from "../../Api";
import condig from "../../Config";

const profileImg = "https://via.placeholder.com/120";

const Profile = () => {
  const fileInputRef = useRef(null);

  const [nickname, setNickname] = useState("Likelion#1253");
  const [intro, setIntro] = useState("안녕하세요");
  const [favoriteSong, setfavoriteSong] = useState("내꺼하자 - 인피니트");

  const [profileImgUrl, setProfileImgUrl] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");


  useEffect(() => {
    fetchrofileData();
  }, []);

  const fetchrofileData = async () => {
    try {
      const response = await get(condig.PROFILE.GET);

      const result = response?.result;

      console.log("프로필 데이터:", result);
      if(!result) return;

      setNickname(result.username ?? "");
      setIntro(result.intro ?? "");
      setProfileImgUrl(result.profileImageUrl ?? null);

      const songResponse = await get(condig.YOUTUBE.ME);

      if(
        songResponse?.isSuccess === false ||
        !Array.isArray(songResponse?.result) 
      ){
        throw new Error("유효하지 않은 노래 데이터 형식");
      }

      const songs = [...songResponse.result].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const latest = songs[0];

      setfavoriteSong(latest ? `${latest.title} - ${latest.artist}` : "");
      } catch (error) {
      console.error("프로필 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  const handleClickEditIcon = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = () => {
    const profileData = {
      nickname,
      intro,
      favoriteSong,
      selectedImageFile,
    };

    console.log("저장된 프로필:", profileData);
    alert("프로필이 저장되었습니다.");
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayImageSrc = previewUrl || profileImgUrl || profileImg;

  return (
    <div className="profile-section">
      <div className="profile-left">
        <div className="profile-top">
          <div className="profile-image-box">
            <img src={displayImageSrc} alt="" className="profile-img" />

            <button
              type="button"
              className="profile-edit-btn"
              onClick={handleClickEditIcon}
            >
              ✎
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="profile-file-input"
              onChange={handleFileChange}
            />
          </div>

          <h2 className="profile-nickname">{nickname}</h2>
        </div>

        <div className="profile-form">
          <label className="profile-label">한 줄 소개</label>
          <input
            className="profile-input"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="한 줄 소개를 입력해주세요"
          />

          <label className="profile-label">좋아하는 노래</label>
          <div className="song-input-box">
            <span className="song-icon">🎵</span>
            <input
              className="song-input"
              value={favoriteSong}
              onChange={(e) => setfavoriteSong(e.target.value)}
              placeholder="좋아하는 노래를 입력해주세요"
            />
            <span className="search-icon">⌕</span>
          </div>
        </div>
      </div>

      <button type="button" className="profile-save-btn" onClick={handleSaveProfile}>
        프로필 저장
      </button>
    </div>
  );
};

export default Profile;
