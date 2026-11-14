import React, { useCallback, useRef, useState, useEffect } from "react";
import { get, put, post, uploadProfile } from "../../Api";
import config from "../../Config";

const profileImg = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#f0eef6"/><circle cx="60" cy="44" r="18" fill="#b5afc9"/><path d="M24 108a36 36 0 0 1 72 0" fill="#b5afc9"/></svg>');

const Profile = () => {
  const fileInputRef = useRef(null);
  const saved = useRef(null);
  const saving = useRef(false);
  const searchRequest = useRef(null);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [nickname, setNickname] = useState("");
  const [intro, setIntro] = useState("");
  const [favoriteSong, setfavoriteSong] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [profileImgUrl, setProfileImgUrl] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const fetchProfileData = useCallback(async ({ signal } = {}) => {
    const [profileResponse, songResponse] = await Promise.all([
      get(config.PROFILE.GET, {}, { signal }),
      get(config.YOUTUBE.ME, {}, { signal }),
    ]);
    const profile = profileResponse?.result;
    if (profileResponse?.isSuccess === false || typeof profile?.username !== "string" ||
        songResponse?.isSuccess === false || !Array.isArray(songResponse?.result)) {
      throw new Error("프로필 데이터를 확인하지 못했습니다.");
    }
    if (signal?.aborted) return;
    const songs = [...songResponse.result].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    const latest = songs[0] || null;
    saved.current = { intro: profile.introduction ?? "", song: latest };
    setNickname(profile.username);
    setIntro(profile.introduction ?? "");
    setProfileImgUrl(profile.profileImageUrl ?? null);
    setfavoriteSong(latest ? `${latest.title} - ${latest.artist}` : "");
    setLoaded(true);
    setLoadError("");
  }, []);

  useEffect(() => {
    if (saving.current) return;
    const controller = new AbortController();
    fetchProfileData({ signal: controller.signal }).catch(() => {
      if (!controller.signal.aborted) setLoadError("프로필을 불러오지 못했습니다. 다시 시도해주세요.");
    });
    return () => controller.abort();
  }, [fetchProfileData, retry]);

  useEffect(() => () => searchRequest.current?.abort(), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleClickEditIcon = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("이미지 파일을 선택해주세요.");
      return;
    }
    setSaveError("");
    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (saving.current || !loaded) return;
    const previousSong = saved.current.song;
    const savedLabel = previousSong ? `${previousSong.title} - ${previousSong.artist}` : "";
    if (!selectedSong && favoriteSong !== savedLabel) {
      setSaveError("검색 결과에서 저장할 노래를 선택해주세요.");
      return;
    }
    saving.current = true;
    setIsSaving(true);
    setSaveError("");
    const completed = [];
    let stage = "한 줄 소개 저장";
    try {
      if (intro !== saved.current.intro) {
        await put(config.PROFILE.INTRO, { introduce: intro });
        saved.current.intro = intro;
        completed.push("한 줄 소개");
      }
      if (selectedImageFile) {
        stage = "사진 저장";
        const response = await uploadProfile(config.PROFILE.PUT, { imageFile: selectedImageFile });
        const url = response?.result?.profileImageUrl;
        if (!url) throw new Error("사진 저장 결과를 확인하지 못했습니다.");
        setProfileImgUrl(url);
        setSelectedImageFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        completed.push("사진");
      }
      if (selectedSong) {
        stage = "노래 저장";
        if (selectedSong.songId !== saved.current.song?.songId) {
          const response = await post(config.YOUTUBE.SAVE, { songId: selectedSong.songId });
          if (response?.result?.songId !== selectedSong.songId) {
            throw new Error("노래 저장 결과를 확인하지 못했습니다.");
          }
          saved.current.song = response.result;
          setfavoriteSong(`${response.result.title} - ${response.result.artist}`);
          completed.push("노래");
        }
        setSelectedSong(null);
      }
      stage = "저장 내용 다시 불러오기";
      await fetchProfileData();
      setShowSearchResults(false);
      alert("프로필이 저장되었습니다.");
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "다시 시도해주세요.";
      setSaveError(`${completed.length ? `${completed.join(", ")}는 저장되었습니다. ` : ""}${stage}에 실패했습니다. ${message}`);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  const handleSerchSong = async () => {
    if (!favoriteSong.trim() || searching || isSaving) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);
    setSaveError("");
    try {
      const response = await get(config.YOUTUBE.SEARCH, { q: favoriteSong.trim() }, { signal: controller.signal });
      const result = response?.result;
      if (response?.isSuccess === false || !Array.isArray(result)) throw new Error("검색 결과를 확인하지 못했습니다.");
      if (controller.signal.aborted) return;
      setSearchResults(result);
      setShowSearchResults(true);
    } catch {
      if (!controller.signal.aborted) setSaveError("노래 검색에 실패했습니다. 다시 시도해주세요.");
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  };
  const handleSelectSong = (picked) => {
    setSelectedSong(picked);
    setfavoriteSong(`${picked.title} - ${picked.artist}`);
    setShowSearchResults(false);
  };
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
              disabled={!loaded || isSaving}
            >
              ✎
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="profile-file-input"
              onChange={handleFileChange}
              disabled={isSaving}
            />
          </div>

          <h2 className="profile-nickname">{nickname}</h2>
        </div>

        <div className="profile-form">
          <label className="profile-label" htmlFor="profile-intro">한 줄 소개</label>
          <input
            className="profile-input"
            id="profile-intro"
            disabled={!loaded || isSaving}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="한 줄 소개를 입력해주세요"
          />

          <label className="profile-label" htmlFor="favorite-song">좋아하는 노래</label>
          <div className="song-input-box">
            <span className="song-icon">🎵</span>
            <input
              className="song-input"
              id="favorite-song"
              disabled={!loaded || isSaving}
              value={favoriteSong}
              placeholder="좋아하는 노래를 입력해주세요"
              onChange={(e) => {
                searchRequest.current?.abort();
                setSearching(false);
                setfavoriteSong(e.target.value);
                setSelectedSong(null);
                setShowSearchResults(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSerchSong();
                }
              }}
            />
            <button type="button" aria-label="노래 검색" disabled={!loaded || isSaving || searching}
            className="search-icon"
            onClick = {handleSerchSong}
            style={{cursor: "pointer"}}
            >⌕</button>
          </div>


            {searching && <p role="status">노래 검색 중...</p>}
            {loadError && <div role="alert">{loadError} <button type="button" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></div>}
            {saveError && <p role="alert">{saveError}</p>}
            {showSearchResults &&
            <div className="search-results">
              {searchResults.length === 0 ? (
                <p>검색 결과가 없습니다.</p>
              ) : (
                searchResults.map((item) => (
                  <button
                  type="button"
                  key={item.songId}
                  className="search-search-item"
                  onClick={() => handleSelectSong(item)}
                  title={`${item.title} - ${item.artist}`}
                  >
                    <span className="search-song-title">{item.title}</span>
                    <span className="search-song-artist">{item.artist}</span>
                  </button>
                ))
              )}
            </div>
          }

        </div>
      </div>

      <button type="button" className="profile-save-btn" onClick={handleSaveProfile} disabled={!loaded || isSaving}>
        {isSaving ? "저장 중..." : "프로필 저장"}
      </button>
    </div>
  );
};

export default Profile;
