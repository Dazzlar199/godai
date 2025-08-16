export class AudioManager {
    constructor() {
        this.sounds = {
            'background': new Audio('/static/background_music.mp3'),
            'click': new Audio('/static/assets/click_sound.mp3'),
            'message': new Audio('/static/assets/message_sound.mp3'),
            'revelation': new Audio('/static/assets/success.mp3'),
            'phase1_voice': new Audio('/static/assets/phase1_voice.mp3'),
            'mediapipe_voice': new Audio('/static/assets/mediapipe_voice.mp3'),
            'finish': new Audio('/static/assets/finish_sound.mp3'),
            'star_finish': new Audio('/static/assets/star_finish.mp3')
        };

        this.sounds.background.loop = true;
        this.sounds.background.volume = 0.3;
        this.sounds.click.volume = 0.7;
        this.sounds.message.volume = 0.7;
        this.sounds.revelation.volume = 0.7;
        this.sounds.phase1_voice.volume = 0.8;
        this.sounds.mediapipe_voice.volume = 0.8;
        this.sounds.finish.volume = 1.0;
        this.sounds.star_finish.volume = 0.8;

        // 스트리밍 오디오를 위한 오디오 객체
        this.streamPlayer = new Audio();
        this.streamPlayer.volume = 1.0;


        // 사용자의 첫 상호작용을 기다립니다.
        this.audioContextResumed = false;
        document.body.addEventListener('click', () => this.resumeAudioContext(), { once: true });
    }

    resumeAudioContext() {
        if (!this.audioContextResumed) {
            console.log("Audio context resumed by user interaction.");
            this.audioContextResumed = true;
            // 배경음악 재생 시도
            this.playSound('background');
        }
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            // 배경음악은 resumeAudioContext에서만 시작합니다.
            if (soundName === 'background') {
                if (this.audioContextResumed && this.sounds.background.paused) {
                    this.sounds.background.play().catch(e => console.error("Error playing background music:", e));
                }
            } else {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => console.error(`Error playing ${soundName}:`, e));
            }
        } else {
            console.warn(`Sound not found: ${soundName}`);
        }
    }

    playStream(url) {
        if (!this.audioContextResumed) {
            console.warn("Audio context not resumed. Please interact with the page first.");
            // 사용자가 상호작용할 때까지 대기했다가 재생할 수 있도록 URL을 저장해 둘 수 있습니다.
            // 예: this.pendingStreamUrl = url;
            return;
        }

        console.log(`[AudioManager] Playing stream from URL: ${url}`);
        this.streamPlayer.src = url;
        this.streamPlayer.play().catch(e => console.error("Error playing stream:", e));
    }


    stopSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
    }
}
