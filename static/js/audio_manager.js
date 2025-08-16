export class AudioManager {
    constructor() {
        const audioFiles = {
            'background': new Audio('./static/background_music.mp3'),
            'click': new Audio('./static/assets/click_sound.mp3'),
            'message': new Audio('./static/assets/message_sound.mp3'),
            'revelation': new Audio('./static/assets/success.mp3'),
            'phase1_voice': new Audio('./static/assets/phase1_voice.mp3'),
            'mediapipe_voice': new Audio('./static/assets/mediapipe_voice.mp3'),
            'finish': new Audio('./static/assets/finish_sound.mp3'),
            'star_finish': new Audio('./static/assets/star_finish.mp3')
        };

        this.sounds = audioFiles;
        this.audioContext = null;
        this.userInteracted = false;

        // 배경음악 설정
        this.sounds.background.loop = true;
        this.sounds.background.volume = 0.3;
        
        // 다른 사운드들 볼륨 설정
        this.sounds.click.volume = 0.5;
        this.sounds.message.volume = 0.6;
        this.sounds.revelation.volume = 0.7;
        this.sounds.phase1_voice.volume = 0.8;
        this.sounds.mediapipe_voice.volume = 0.8;
        this.sounds.finish.volume = 0.8;
        this.sounds.star_finish.volume = 0.8;

        // 사용자 상호작용 감지
        this.setupUserInteractionListener();
    }

    setupUserInteractionListener() {
        const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
        const handleInteraction = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                console.log('[AudioManager] 사용자 상호작용 감지됨');
                this.resumeAudioContext();
            }
        };

        interactionEvents.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: true });
        });
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playSound(soundName) {
        // 사용자가 상호작용하지 않았으면 오디오 재생하지 않음
        if (!this.userInteracted && soundName !== 'click') {
            console.log(`[AudioManager] 사용자 상호작용 전, ${soundName} 재생 건너뜀`);
            return;
        }

        const sound = this.sounds[soundName];
        if (sound) {
            try {
                // 배경음악이 아닌 경우에만 재생
                if (soundName === 'background') {
                    if (this.userInteracted) {
                        sound.play().catch(error => {
                            console.log(`[AudioManager] 배경음악 재생 실패: ${error.message}`);
                        });
                    }
                } else {
                    // 효과음은 항상 재생 시도
                    sound.currentTime = 0;
                    sound.play().catch(error => {
                        console.log(`[AudioManager] ${soundName} 재생 실패: ${error.message}`);
                    });
                }
            } catch (error) {
                console.log(`[AudioManager] ${soundName} 재생 중 오류: ${error.message}`);
            }
        } else {
            console.warn(`[AudioManager] 사운드 '${soundName}'을 찾을 수 없습니다.`);
        }
    }

    stopSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    stopAllSounds() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    setVolume(soundName, volume) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.volume = Math.max(0, Math.min(1, volume));
        }
    }

    getVolume(soundName) {
        const sound = this.sounds[soundName];
        return sound ? sound.volume : 0;
    }
}
