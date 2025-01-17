/* eslint-disable handle-callback-err */
/* eslint-disable react/no-did-mount-set-state */
/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import Video from 'react-native-video';
import {
  TouchableWithoutFeedback,
  TouchableHighlight,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Animated,
  SafeAreaView,
  Easing,
  Image,
  View,
  Text,
} from 'react-native';
import padStart from 'lodash/padStart';
import {TouchableOpacity, Platform} from 'react-native';
import TextTicker from 'react-native-text-ticker';
import LottieView from 'lottie-react-native';

export default class VideoPlayer extends Component {
  static defaultProps = {
    toggleResizeModeOnFullscreen: true,
    controlAnimationTiming: 500,
    doubleTapTime: 130,
    playInBackground: false,
    playWhenInactive: false,
    resizeMode: 'contain',
    isFullscreen: false,
    showOnStart: false,
    paused: false,
    timeNext: false,
    repeat: false,
    muted: false,
    volume: 1,
    title: '',
    rate: 1,
    showTimeRemaining: true,
    showHours: false,
    like: '',
    subCc: '',
    likeCnt: 0,
    playCnt: 0,
    isPortrait: '',
    vttYn: '',
    userName: '',
    lottieTest: false,
  };

  constructor(props) {
    super(props);
    this.lottieRef = React.createRef();
    this.playLottieRef = this.playLottieRef.bind(this);
    /**
     * All of our values that are updated by the
     * methods and listeners in this class
     */
    this.state = {
      // Video
      resizeMode: this.props.resizeMode,
      paused: this.props.paused,
      muted: this.props.muted,
      volume: this.props.volume,
      rate: this.props.rate,
      // Controls

      isFullscreen:
        this.props.isFullScreen || this.props.resizeMode === 'cover' || false,
      showTimeRemaining: this.props.showTimeRemaining,
      showHours: this.props.showHours,
      volumeTrackWidth: 0,
      volumeFillWidth: 0,
      seekerFillWidth: 0,
      showControls: this.props.showOnStart,
      volumePosition: 0,
      seekerPosition: 0,
      volumeOffset: 0,
      seekerOffset: 0,
      seeking: false,
      originallyPaused: false,
      scrubbing: false,
      loading: false,
      currentTime: 0,
      error: false,
      duration: 0,
      like: this.props.like,
      subCc: this.props.subCc,
    };

    /**
     * Any options that can be set at init.
     */
    this.opts = {
      playWhenInactive: this.props.playWhenInactive,
      playInBackground: this.props.playInBackground,
      repeat: this.props.repeat,
      title: this.props.title,
      likeCnt: this.props.likeCnt,
      playCnt: this.props.playCnt,
      isPortrait: this.props.isPortrait,
      vttYn: this.props.vttYn,
      userName: this.props.userName,
    };

    /**
     * Our app listeners and associated methods
     */
    this.events = {
      onError: this.props.onError || this._onError.bind(this),
      onBack: this.props.onBack || this._onBack.bind(this),
      onEnd: this.props.onEnd || this._onEnd.bind(this),
      onScreenTouch: this._onScreenTouch.bind(this),
      onScreenNextTouch: this._onScreenNextTouch.bind(this),
      onScreenBackTouch: this._onScreenBackTouch.bind(this),
      onEnterFullscreen: this.props.onEnterFullscreen,
      onExitFullscreen: this.props.onExitFullscreen,
      onShowControls: this.props.onShowControls,
      onHideControls: this.props.onHideControls,
      onLoadStart: this._onLoadStart.bind(this),
      onProgress: this._onProgress.bind(this),
      onSeek: this._onSeek.bind(this),
      onLoad: this._onLoad.bind(this),
      onPause: this.props.onPause,
      onPlay: this.props.onPlay,
      toggleLike: this.props.toggleLike,
      toggleSubCc: this.props.toggleSubCc,
      toggleSub: this.props.toggleSub,
    };

    /**
     * Functions used throughout the application
     */
    this.methods = {
      toggleFullscreen: this._toggleFullscreen.bind(this),
      togglePlayPause: this._togglePlayPause.bind(this),
      togglePlayNext: this._togglePlayNext.bind(this),
      togglePlayBack: this._togglePlayBack.bind(this),
      toggleControls: this._toggleControls.bind(this),
      toggleTimer: this._toggleTimer.bind(this),
      toggleLike: this._toggleLike.bind(this),
      toggleSubCc: this._toggleSubCc.bind(this),
    };

    /**
     * Player information
     */
    this.player = {
      controlTimeoutDelay: this.props.controlTimeout || 15000,
      volumePanResponder: PanResponder,
      seekPanResponder: PanResponder,
      controlTimeout: null,
      tapActionTimeout: null,
      volumeWidth: 150,
      iconOffset: 0,
      seekerWidth: 0,
      ref: Video,
      scrubbingTimeStep: this.props.scrubbing || 0,
      tapAnywhereToPause: this.props.tapAnywhereToPause,
    };

    /**
     * Various animations
     */
    const initialValue = this.props.showOnStart ? 1 : 0;

    this.animations = {
      bottomControl: {
        marginBottom: new Animated.Value(0),
        opacity: new Animated.Value(initialValue),
      },
      topControl: {
        marginTop: new Animated.Value(0),
        opacity: new Animated.Value(initialValue),
      },
      video: {
        opacity: new Animated.Value(1),
      },
      loader: {
        rotate: new Animated.Value(0),
        MAX_VALUE: 360,
      },
    };

    /**
     * Various styles that be added...
     */
    this.styles = {
      videoStyle: this.props.videoStyle || {},
      containerStyle: this.props.style || {},
    };
  }

  componentDidUpdate = prevProps => {
    const {isFullscreen} = this.props;

    if (prevProps.isFullscreen !== isFullscreen) {
      this.setState({
        isFullscreen,
      });
    }
  };
  /**
    | -------------------------------------------------------
    | Events
    | -------------------------------------------------------
    |
    | These are the events that the <Video> component uses
    | and can be overridden by assigning it as a prop.
    | It is suggested that you override onEnd.
    |
    */

  /**
   * When load starts we display a loading icon
   * and show the controls.
   */
  _onLoadStart() {
    let state = this.state;
    state.loading = true;
    this.loadAnimation();
    this.setState(state);

    if (typeof this.props.onLoadStart === 'function') {
      this.props.onLoadStart(...arguments);
    }
  }

  /**
   * When load is finished we hide the load icon
   * and hide the controls. We also set the
   * video duration.
   *
   * @param {object} data The video meta data
   */
  _onLoad(data = {}) {
    let state = this.state;

    state.duration = data.duration;
    state.loading = false;
    this.setState(state);

    if (state.showControls) {
      this.setControlTimeout();
    }

    if (typeof this.props.onLoad === 'function') {
      this.props.onLoad(...arguments);
    }
  }

  /**
   * For onprogress we fire listeners that
   * update our seekbar and timer.
   *
   * @param {object} data The video meta data
   */
  _onProgress(data = {}) {
    let state = this.state;
    if (!state.scrubbing) {
      state.currentTime = data.currentTime;

      if (!state.seeking) {
        const position = this.calculateSeekerPosition();
        this.setSeekerPosition(position);
      }

      if (typeof this.props.onProgress === 'function') {
        this.props.onProgress(...arguments);
      }

      this.setState(state);
    }
  }

  /**
   * For onSeek we clear scrubbing if set.
   *
   * @param {object} data The video meta data
   */
  _onSeek(data = {}) {
    let state = this.state;
    if (state.scrubbing) {
      state.scrubbing = false;
      state.currentTime = data.currentTime;

      // Seeking may be false here if the user released the seek bar while the player was still processing
      // the last seek command. In this case, perform the steps that have been postponed.
      if (!state.seeking) {
        this.setControlTimeout();
        state.paused = state.originallyPaused;
      }

      this.setState(state);
    }
  }

  /**
   * It is suggested that you override this
   * command so your app knows what to do.
   * Either close the video or go to a
   * new page.
   */
  _onEnd() {}

  /**
   * Set the error state to true which then
   * changes our renderError function
   *
   * @param {object} err  Err obj returned from <Video> component
   */
  _onError(err) {
    let state = this.state;
    state.error = true;
    state.loading = false;

    this.setState(state);
  }

  /**
   * This is a single and double tap listener
   * when the user taps the screen anywhere.
   * One tap toggles controls and/or toggles pause,
   * two toggles fullscreen mode.
   */
  _onScreenTouch() {
    if (this.player.tapActionTimeout) {
      clearTimeout(this.player.tapActionTimeout);
      this.player.tapActionTimeout = 0;
      // this.methods.toggleFullscreen(); // 전체 화면 필수 아님.
      const state = this.state;
      if (state.showControls) {
        this.resetControlTimeout();
      }
    } else {
      this.player.tapActionTimeout = setTimeout(() => {
        const state = this.state;
        if (this.player.tapAnywhereToPause && state.showControls) {
          this.methods.togglePlayPause();
          this.resetControlTimeout();
        } else {
          this.methods.toggleControls();
        }
        this.player.tapActionTimeout = 0;
      }, this.props.doubleTapTime);
    }
  }
  _onScreenNextTouch() {
    if (this.player.tapActionTimeout) {
      clearTimeout(this.player.tapActionTimeout);
      this.player.tapActionTimeout = 0;
      const state = this.state;
      if (state.showControls) {
        this.resetControlTimeout();
      }
      if (state.duration === state.currentTime) {
        this.events.onEnd();
      } else {
        this.seekTo(state.currentTime + 10);
      }
    } else {
      this.player.tapActionTimeout = setTimeout(() => {
        const state = this.state;
        if (this.player.tapAnywhereToPause && state.showControls) {
          this.methods.togglePlayPause();
          this.resetControlTimeout();
        } else {
          this.methods.toggleControls();
        }
        this.player.tapActionTimeout = 0;
      }, this.props.doubleTapTime);
    }
  }
  _onScreenBackTouch() {
    if (this.player.tapActionTimeout) {
      clearTimeout(this.player.tapActionTimeout);
      this.player.tapActionTimeout = 0;
      const state = this.state;
      if (state.showControls) {
        this.resetControlTimeout();
      }
      if (state.currentTime === 0) {
      } else {
        this.seekTo(state.currentTime - 10);
      }
    } else {
      this.player.tapActionTimeout = setTimeout(() => {
        const state = this.state;
        if (this.player.tapAnywhereToPause && state.showControls) {
          this.methods.togglePlayPause();
          this.resetControlTimeout();
        } else {
          this.methods.toggleControls();
        }
        this.player.tapActionTimeout = 0;
      }, this.props.doubleTapTime);
    }
  }

  /**
    | -------------------------------------------------------
    | Methods
    | -------------------------------------------------------
    |
    | These are all of our functions that interact with
    | various parts of the class. Anything from
    | calculating time remaining in a video
    | to handling control operations.
    |
    */

  /**
   * Set a timeout when the controls are shown
   * that hides them after a length of time.
   * Default is 15s
   */
  setControlTimeout() {
    this.player.controlTimeout = setTimeout(() => {
      this._hideControls();
    }, this.player.controlTimeoutDelay);
  }

  /**
   * Clear the hide controls timeout.
   */
  clearControlTimeout() {
    clearTimeout(this.player.controlTimeout);
  }

  /**
   * Reset the timer completely
   */
  resetControlTimeout() {
    this.clearControlTimeout();
    this.setControlTimeout();
  }

  /**
   * Animation to hide controls. We fade the
   * display to 0 then move them off the
   * screen so they're not interactable
   */
  hideControlAnimation() {
    Animated.parallel([
      Animated.timing(this.animations.topControl.opacity, {
        toValue: 0,
        duration: this.props.controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(this.animations.topControl.marginTop, {
        toValue: -100,
        duration: this.props.controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(this.animations.bottomControl.opacity, {
        toValue: 0,
        duration: this.props.controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(this.animations.bottomControl.marginBottom, {
        toValue: -100,
        duration: this.props.controlAnimationTiming,
        useNativeDriver: false,
      }),
    ]).start();
  }

  /**
   * Animation to show controls...opposite of
   * above...move onto the screen and then
   * fade in.
   */
  showControlAnimation() {
    Animated.parallel([
      Animated.timing(this.animations.topControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: this.props.controlAnimationTiming,
      }),
      Animated.timing(this.animations.topControl.marginTop, {
        toValue: 0,
        useNativeDriver: false,
        duration: this.props.controlAnimationTiming,
      }),
      Animated.timing(this.animations.bottomControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: this.props.controlAnimationTiming,
      }),
      Animated.timing(this.animations.bottomControl.marginBottom, {
        toValue: 0,
        useNativeDriver: false,
        duration: this.props.controlAnimationTiming,
      }),
    ]).start();
  }

  /**
   * Loop animation to spin loader icon. If not loading then stop loop.
   */
  loadAnimation() {
    if (this.state.loading) {
      Animated.sequence([
        Animated.timing(this.animations.loader.rotate, {
          toValue: this.animations.loader.MAX_VALUE,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(this.animations.loader.rotate, {
          toValue: 0,
          duration: 0,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]).start(this.loadAnimation.bind(this));
    }
  }

  /**
   * Function to hide the controls. Sets our
   * state then calls the animation.
   */
  _hideControls() {
    if (this.mounted) {
      let state = this.state;
      state.showControls = false;
      this.hideControlAnimation();
      typeof this.events.onHideControls === 'function' &&
        this.events.onHideControls();

      this.setState(state);
    }
  }

  /**
   * Function to toggle controls based on
   * current state.
   */
  _toggleControls() {
    let state = this.state;
    state.showControls = !state.showControls;

    if (state.showControls) {
      this.showControlAnimation();
      this.setControlTimeout();
      typeof this.events.onShowControls === 'function' &&
        this.events.onShowControls();
    } else {
      this.hideControlAnimation();
      this.clearControlTimeout();
      typeof this.events.onHideControls === 'function' &&
        this.events.onHideControls();
    }

    this.setState(state);
  }

  /**
   * Toggle fullscreen changes resizeMode on
   * the <Video> component then updates the
   * isFullscreen state.
   */
  _toggleFullscreen() {
    let state = this.state;
    state.isFullscreen = !state.isFullscreen;
    if (this.props.toggleResizeModeOnFullscreen) {
      state.resizeMode = state.isFullscreen === true ? 'cover' : 'contain';
    }
    if (state.isFullscreen) {
      typeof this.events.onEnterFullscreen === 'function' &&
        this.events.onEnterFullscreen();
    } else {
      typeof this.events.onExitFullscreen === 'function' &&
        this.events.onExitFullscreen();
    }
    this.setState(state);
  }

  /**
   * Toggle playing state on <Video> component
   */
  _togglePlayPause() {
    let state = this.state;
    state.paused = !state.paused;

    if (state.paused) {
      typeof this.events.onPause === 'function' && this.events.onPause();
    } else {
      typeof this.events.onPlay === 'function' && this.events.onPlay();
    }

    this.setState(state);
  }
  _togglePlayNext() {
    let state = this.state;
    if (state.duration === state.currentTime) {
      this.events.onEnd();
    } else {
      this.seekTo(state.currentTime + 10);
    }
  }
  _togglePlayBack() {
    let state = this.state;
    if (state.currentTime === 0) {
    } else {
      this.seekTo(state.currentTime - 10);
    }
  }

  /**
   * Toggle between showing time remaining or
   * video duration in the timer control
   */
  _toggleTimer() {
    let state = this.state;
    state.showTimeRemaining = !state.showTimeRemaining;
    this.setState(state);
  }

  _toggleLike() {
    this.props.toggleLike();
    let state = this.state;
    state.like = !state.like;
    this.setState(state);
  }

  _toggleSubCc() {
    this.props.toggleSubCc();
    let state = this.state;
    state.subCc = !state.subCc;
    this.setState(state);
  }

  /**
   * The default 'onBack' function pops the navigator
   * and as such the video player requires a
   * navigator prop by default.
   */
  _onBack() {
    if (this.props.navigator && this.props.navigator.pop) {
      this.props.navigator.pop();
    } else {
      console.warn(
        'Warning: _onBack requires navigator property to function. Either modify the onBack prop or pass a navigator prop',
      );
    }
  }

  /**
   * Calculate the time to show in the timer area
   * based on if they want to see time remaining
   * or duration. Formatted to look as 00:00.
   */
  calculateTime() {
    if (this.state.showTimeRemaining) {
      const time = this.state.duration - this.state.currentTime;
      return `-${this.formatTime(time)}`;
    }

    return this.formatTime(this.state.currentTime);
  }

  /**
   * Format a time string as mm:ss
   *
   * @param {int} time time in milliseconds
   * @return {string} formatted time string in mm:ss format
   */
  formatTime(time = 0) {
    const symbol = this.state.showRemainingTime ? '-' : '';
    time = Math.min(Math.max(time, 0), this.state.duration);

    if (!this.state.showHours) {
      const formattedMinutes = padStart(Math.floor(time / 60).toFixed(0), 2, 0);
      const formattedSeconds = padStart(Math.floor(time % 60).toFixed(0), 2, 0);

      return `${symbol}${formattedMinutes}:${formattedSeconds}`;
    }

    const formattedHours = padStart(Math.floor(time / 3600).toFixed(0), 2, 0);
    const formattedMinutes = padStart(
      (Math.floor(time / 60) % 60).toFixed(0),
      2,
      0,
    );
    const formattedSeconds = padStart(Math.floor(time % 60).toFixed(0), 2, 0);

    return `${symbol}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  /**
   * Set the position of the seekbar's components
   * (both fill and handle) according to the
   * position supplied.
   *
   * @param {float} position position in px of seeker handle}
   */
  setSeekerPosition(position = 0) {
    let state = this.state;
    position = this.constrainToSeekerMinMax(position);

    state.seekerFillWidth = position;
    state.seekerPosition = position;

    if (!state.seeking) {
      state.seekerOffset = position;
    }

    this.setState(state);
  }

  /**
   * Constrain the location of the seeker to the
   * min/max value based on how big the
   * seeker is.
   *
   * @param {float} val position of seeker handle in px
   * @return {float} constrained position of seeker handle in px
   */
  constrainToSeekerMinMax(val = 0) {
    if (val <= 0) {
      return 0;
    } else if (val >= this.player.seekerWidth) {
      return this.player.seekerWidth;
    }
    return val;
  }

  /**
   * Calculate the position that the seeker should be
   * at along its track.
   *
   * @return {float} position of seeker handle in px based on currentTime
   */
  calculateSeekerPosition() {
    const percent = this.state.currentTime / this.state.duration;
    return this.player.seekerWidth * percent;
  }

  /**
   * Return the time that the video should be at
   * based on where the seeker handle is.
   *
   * @return {float} time in ms based on seekerPosition.
   */
  calculateTimeFromSeekerPosition() {
    const percent = this.state.seekerPosition / this.player.seekerWidth;
    return this.state.duration * percent;
  }

  /**
   * Seek to a time in the video.
   *
   * @param {float} time time to seek to in ms
   */
  seekTo(time = 0) {
    let state = this.state;
    state.currentTime = time;
    this.player.ref.seek(time);
    this.setState(state);
  }

  /**
   * Set the position of the volume slider
   *
   * @param {float} position position of the volume handle in px
   */
  setVolumePosition(position = 0) {
    let state = this.state;
    position = this.constrainToVolumeMinMax(position);
    state.volumePosition = position + this.player.iconOffset;
    state.volumeFillWidth = position;

    state.volumeTrackWidth = this.player.volumeWidth - state.volumeFillWidth;

    if (state.volumeFillWidth < 0) {
      state.volumeFillWidth = 0;
    }

    if (state.volumeTrackWidth > 150) {
      state.volumeTrackWidth = 150;
    }

    this.setState(state);
  }

  /**
   * Constrain the volume bar to the min/max of
   * its track's width.
   *
   * @param {float} val position of the volume handle in px
   * @return {float} contrained position of the volume handle in px
   */
  constrainToVolumeMinMax(val = 0) {
    if (val <= 0) {
      return 0;
    } else if (val >= this.player.volumeWidth + 9) {
      return this.player.volumeWidth + 9;
    }
    return val;
  }

  /**
   * Get the volume based on the position of the
   * volume object.
   *
   * @return {float} volume level based on volume handle position
   */
  calculateVolumeFromVolumePosition() {
    return this.state.volumePosition / this.player.volumeWidth;
  }

  /**
   * Get the position of the volume handle based
   * on the volume
   *
   * @return {float} volume handle position in px based on volume
   */
  calculateVolumePositionFromVolume() {
    return this.player.volumeWidth * this.state.volume;
  }

  /**
    | -------------------------------------------------------
    | React Component functions
    | -------------------------------------------------------
    |
    | Here we're initializing our listeners and getting
    | the component ready using the built-in React
    | Component methods
    |
    */

  /**
   * Before mounting, init our seekbar and volume bar
   * pan responders.
   */
  UNSAFE_componentWillMount() {
    this.initSeekPanResponder();
    this.initVolumePanResponder();
  }

  /**
   * To allow basic playback management from the outside
   * we have to handle possible props changes to state changes
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.state.paused !== nextProps.paused) {
      this.setState({
        paused: nextProps.paused,
      });
    }

    if (this.styles.videoStyle !== nextProps.videoStyle) {
      this.styles.videoStyle = nextProps.videoStyle;
    }

    if (this.styles.containerStyle !== nextProps.style) {
      this.styles.containerStyle = nextProps.style;
    }
  }

  /**
   * Upon mounting, calculate the position of the volume
   * bar based on the volume property supplied to it.
   */
  componentDidMount() {
    const position = this.calculateVolumePositionFromVolume();
    let state = this.state;
    this.setVolumePosition(position);
    state.volumeOffset = position;
    this.mounted = true;

    this.setState(state);
  }

  /**
   * When the component is about to unmount kill the
   * timeout less it fire in the prev/next scene
   */
  componentWillUnmount() {
    this.mounted = false;
    this.clearControlTimeout();
  }

  /**
   * Get our seekbar responder going
   */
  initSeekPanResponder() {
    this.player.seekPanResponder = PanResponder.create({
      // Ask to be the responder.
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,

      /**
       * When we start the pan tell the machine that we're
       * seeking. This stops it from updating the seekbar
       * position in the onProgress listener.
       */
      onPanResponderGrant: (evt, gestureState) => {
        let state = this.state;
        this.clearControlTimeout();
        const position = evt.nativeEvent.locationX;
        this.setSeekerPosition(position);
        state.seeking = true;
        state.originallyPaused = state.paused;
        state.scrubbing = false;
        if (this.player.scrubbingTimeStep > 0) {
          state.paused = true;
        }
        this.setState(state);
      },

      /**
       * When panning, update the seekbar position, duh.
       */
      onPanResponderMove: (evt, gestureState) => {
        const position = this.state.seekerOffset + gestureState.dx;
        this.setSeekerPosition(position);
        let state = this.state;

        if (
          this.player.scrubbingTimeStep > 0 &&
          !state.loading &&
          !state.scrubbing
        ) {
          const time = this.calculateTimeFromSeekerPosition();
          const timeDifference = Math.abs(state.currentTime - time) * 1000;

          if (
            time < state.duration &&
            timeDifference >= this.player.scrubbingTimeStep
          ) {
            state.scrubbing = true;

            this.setState(state);
            setTimeout(() => {
              this.player.ref.seek(time, this.player.scrubbingTimeStep);
            }, 1);
          }
        }
      },

      /**
       * On release we update the time and seek to it in the video.
       * If you seek to the end of the video we fire the
       * onEnd callback
       */
      onPanResponderRelease: (evt, gestureState) => {
        const time = this.calculateTimeFromSeekerPosition();
        let state = this.state;
        if (time >= state.duration && !state.loading) {
          state.paused = true;
          this.events.onEnd();
        } else if (state.scrubbing) {
          state.seeking = false;
        } else {
          this.seekTo(time);
          this.setControlTimeout();
          state.paused = state.originallyPaused;
          state.seeking = false;
        }
        this.setState(state);
      },
    });
  }

  /**
   * Initialize the volume pan responder.
   */
  initVolumePanResponder() {
    this.player.volumePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.clearControlTimeout();
      },

      /**
       * Update the volume as we change the position.
       * If we go to 0 then turn on the mute prop
       * to avoid that weird static-y sound.
       */
      onPanResponderMove: (evt, gestureState) => {
        let state = this.state;
        const position = this.state.volumeOffset + gestureState.dx;

        this.setVolumePosition(position);
        state.volume = this.calculateVolumeFromVolumePosition();

        if (state.volume <= 0) {
          state.muted = true;
        } else {
          state.muted = false;
        }

        this.setState(state);
      },

      /**
       * Update the offset...
       */
      onPanResponderRelease: (evt, gestureState) => {
        let state = this.state;
        state.volumeOffset = state.volumePosition;
        this.setControlTimeout();
        this.setState(state);
      },
    });
  }

  /**
    | -------------------------------------------------------
    | Rendering
    | -------------------------------------------------------
    |
    | This section contains all of our render methods.
    | In addition to the typical React render func
    | we also have all the render methods for
    | the controls.
    |
    */

  /**
   * Standard render control function that handles
   * everything except the sliders. Adds a
   * consistent <TouchableHighlight>
   * wrapper and styling.
   */
  renderControl(children, callback, style = {}) {
    return (
      <TouchableHighlight
        underlayColor="transparent"
        activeOpacity={0.3}
        onPress={() => {
          this.resetControlTimeout();
          callback();
        }}
        style={[styles.controls.control, style]}>
        {children}
      </TouchableHighlight>
    );
  }

  /**
   * Renders an empty control, used to disable a control without breaking the view layout.
   */
  renderNullControl() {
    return <View style={[styles.controls.control]} />;
  }

  /**
   * Groups the top bar controls together in an animated
   * view and spaces them out.
   */
  renderTopControls() {
    const backControl = this.props.disableBack
      ? this.renderNullControl()
      : this.renderBack();
    const fullscreenControl = this.props.disableFullscreen
      ? this.renderNullControl()
      : this.renderFullscreen();
    const toggleLike = this.renderLike();
    const toggleSubCc = this.renderSub();
    const isPortrait = this.props.isPortrait;
    const vttYn = this.props.vttYn;

    if (isPortrait === 'N') {
      return (
        <Animated.View
          style={[
            styles.controls.top,
            {
              opacity: this.animations.topControl.opacity,
              marginTop: this.animations.topControl.marginTop,
            },
          ]}>
          <ImageBackground
            source={require('./assets/img/top-vignette.png')}
            style={[styles.controls.column]}
            imageStyle={[styles.controls.vignette]}>
            <SafeAreaView style={styles.controls.topControlGroup}>
              {/* <View style={{height:'100%'}}>{backControl}</View> */}
              <View
                style={{width: '100%', marginTop: 10, flexDirection: 'row'}}>
                <View style={{width: '5%', alignItems: 'center'}}>
                  <View style={{width: '100%'}}>{backControl}</View>
                </View>
                <View style={{width: '75%'}}>
                  <View style={{width: '100%'}}>{this.renderTopTitle()}</View>
                  <View
                    style={{width: '100%', marginTop: 2, flexDirection: 'row'}}>
                    {this.renderUserName()}
                    <Text
                      style={[styles.controls.text, styles.controls.titleText]}>
                      {' '}
                      View{' '}
                    </Text>
                    {this.renderPlayCnt()}
                  </View>
                </View>
                <View
                  style={
                    Platform.OS === 'ios'
                      ? {
                          width: '20%',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          marginLeft: 15,
                        }
                      : {
                          width: '20%',
                          justifyContent: 'flex-end',
                          flexDirection: 'row',
                        }
                  }>
                  <View style={{width: '30%'}}>
                    <View>{toggleLike}</View>
                    <View>{this.renderLikeCnt()}</View>
                  </View>
                  <View
                    style={{
                      width: '30%',
                      display: vttYn === true ? 'flex' : 'none',
                    }}>
                    {toggleSubCc}
                  </View>
                  <View style={{width: '30%'}}>{fullscreenControl}</View>
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </Animated.View>
      );
    }
    if (isPortrait === 'Y') {
      return (
        <Animated.View
          style={[
            styles.controls.top,
            {
              opacity: this.animations.topControl.opacity,
              marginTop: this.animations.topControl.marginTop,
            },
          ]}>
          <ImageBackground
            source={require('./assets/img/top-vignette.png')}
            style={[styles.controls.column]}
            imageStyle={[styles.controls.vignette]}>
            <SafeAreaView style={styles.controls.topControlGroup}>
              <View style={{width: '100%', flexDirection: 'row'}}>
                <View style={{width: '10%', alignItems: 'center'}}>
                  <View style={{width: '100%'}}>{backControl}</View>
                </View>
                <View style={{width: '50%'}}>
                  <View style={{width: '100%'}}>{this.renderTopTitle()}</View>
                  <View
                    style={{width: '100%', marginTop: 2, flexDirection: 'row'}}>
                    {this.renderUserName()}
                    <Text
                      style={[styles.controls.text, styles.controls.titleText]}>
                      {' '}
                      View{' '}
                    </Text>
                    {this.renderPlayCnt()}
                  </View>
                </View>
                <View
                  style={
                    Platform.OS === 'ios'
                      ? {
                          width: '40%',
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                        }
                      : {
                          width: '40%',
                          justifyContent: 'flex-end',
                          flexDirection: 'row',
                        }
                  }>
                  <View style={{width: '30%'}}>
                    <View>{toggleLike}</View>
                    <View>{this.renderLikeCnt()}</View>
                  </View>
                  <View
                    style={{
                      width: '30%',
                      display: vttYn === true ? 'flex' : 'none',
                    }}>
                    {toggleSubCc}
                  </View>
                  <View style={{width: '30%'}}>{fullscreenControl}</View>
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </Animated.View>
      );
    }
  }

  renderCenterControls() {
    const isPortrait = this.props.isPortrait;
    const playPauseControl = this.props.disablePlayPause
      ? this.renderNullControl()
      : this.renderCenterPlayPause();

    const playNextControl = this.props.disablePlayPause
      ? this.renderNullControl()
      : this.renderCenterPlayNext();
    const playBackControl = this.props.disablePlayPause
      ? this.renderNullControl()
      : this.renderCenterPlayBack();

    if (isPortrait === 'N') {
      return (
        <Animated.View
          style={[
            styles.controls.center,
            {
              opacity: this.animations.topControl.opacity,
              marginTop: this.animations.topControl.marginTop,
            },
          ]}>
          <SafeAreaView style={styles.controls.centerControlGroup}>
            <View
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={this.events.onScreenBackTouch}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {playBackControl}
                </TouchableOpacity>
                {/* <View style={{width: '100%',alignItems:'center'}}>{playBackControl}</View> */}
              </View>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <View style={{width: '100%', alignItems: 'center'}}>
                  {playPauseControl}
                </View>
              </View>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={this.events.onScreenNextTouch}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {playNextControl}
                </TouchableOpacity>
                {/* <View style={{width: '100%',alignItems:'center'}}>{playNextControl}</View> */}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      );
    }
    if (isPortrait === 'Y') {
      return (
        <Animated.View
          style={[
            styles.controls.center,
            {
              opacity: this.animations.topControl.opacity,
              marginTop: this.animations.topControl.marginTop,
            },
          ]}>
          <SafeAreaView style={styles.controls.centerControlGroup}>
            <View
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={this.events.onScreenBackTouch}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {playBackControl}
                </TouchableOpacity>
                {/* <View style={{width: '100%',alignItems:'center'}}>{playBackControl}</View> */}
              </View>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <View style={{width: '100%', alignItems: 'center'}}>
                  {playPauseControl}
                </View>
              </View>
              <View
                style={{
                  width: '30%',
                  height: '100%',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={this.events.onScreenNextTouch}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {playNextControl}
                </TouchableOpacity>
                {/* <View style={{width: '100%',alignItems:'center'}}>{playNextControl}</View> */}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      );
    }
  }

  /**
   * Back button control
   */
  renderBack() {
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.events.onBack()}
        style={{width: '100%', height: 42, paddingLeft: 10, paddingTop: 5}}>
        <Image
          source={require('./assets/img/back.png')}
          style={[styles.controls.back]}
        />
      </TouchableOpacity>,
      this.events.onBack,
      styles.controls.back,
    );
  }

  /**
   * Render the volume slider and attach the pan handlers
   */
  renderVolume() {
    return (
      <View style={styles.volume.container}>
        <View
          style={[styles.volume.fill, {width: this.state.volumeFillWidth}]}
        />
        <View
          style={[styles.volume.track, {width: this.state.volumeTrackWidth}]}
        />
        <View
          style={[styles.volume.handle, {left: this.state.volumePosition}]}
          {...this.player.volumePanResponder.panHandlers}>
          <Image
            style={styles.volume.icon}
            source={require('./assets/img/volume.png')}
          />
        </View>
      </View>
    );
  }

  /**
   * Render fullscreen toggle and set icon based on the fullscreen state.
   */
  renderFullscreen() {
    let source =
      this.state.isFullscreen === true
        ? require('./assets/img/shrink.png')
        : require('./assets/img/expand.png');
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.methods.toggleFullscreen()}
        style={{
          width: '100%',
          height: this.props.isPortrait === 'N' ? 27.5 : 27.5,
          alignItems: 'center',
          justifyContent: this.props.isPortrait === 'N' ? 'center' : 'center',
        }}>
        <Image source={source} style={{width: 20, height: 20}} />
      </TouchableOpacity>,
      this.methods.toggleFullscreen,
      styles.controls.fullscreen,
    );
  }

  /**
   * Render bottom control group and wrap it in a holder
   */
  renderBottomControls() {
    const timerControl = this.props.disableTimer
      ? this.renderNullControl()
      : this.renderTimer();
    const seekbarControl = this.props.disableSeekbar
      ? this.renderNullControl()
      : this.renderSeekbar();
    const playPauseControl = this.props.disablePlayPause
      ? this.renderNullControl()
      : this.renderPlayPause();

    return (
      <Animated.View
        style={[
          styles.controls.bottom,
          {
            opacity: this.animations.bottomControl.opacity,
            marginBottom: this.animations.bottomControl.marginBottom,
          },
        ]}>
        <ImageBackground
          source={require('./assets/img/bottom-vignette.png')}
          style={[styles.controls.column]}
          imageStyle={[styles.controls.vignette]}>
          {Platform.OS === 'ios' ? (
            <View style={{width: '94%'}}>{seekbarControl}</View>
          ) : (
            <>{seekbarControl}</>
          )}
          <SafeAreaView
            style={[styles.controls.row, styles.controls.bottomControlGroup]}>
            {playPauseControl}
            {timerControl}
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>
    );
  }

  /**
   * Render the seekbar and attach its handlers
   */
  renderSeekbar() {
    return (
      <View
        style={styles.seekbar.container}
        collapsable={false}
        {...this.player.seekPanResponder.panHandlers}>
        <View
          style={styles.seekbar.track}
          onLayout={event =>
            (this.player.seekerWidth = event.nativeEvent.layout.width)
          }
          pointerEvents={'none'}>
          <View
            style={[
              styles.seekbar.fill,
              {
                width: this.state.seekerFillWidth,
                backgroundColor: this.props.seekColor || '#FFF',
              },
            ]}
            pointerEvents={'none'}
          />
        </View>
        <View
          style={[styles.seekbar.handle, {left: this.state.seekerPosition}]}
          pointerEvents={'none'}>
          <View
            style={[
              styles.seekbar.circle,
              {backgroundColor: this.props.seekColor || '#FFF'},
            ]}
            pointerEvents={'none'}
          />
        </View>
      </View>
    );
  }

  /**
   * Render the play/pause button and show the respective icon
   */
  renderPlayPause() {
    let source =
      this.state.paused === true
        ? require('./assets/img/play.png')
        : require('./assets/img/pause.png');
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.methods.togglePlayPause()}
        style={{
          width: '100%',
          height: 30,
          justifyContent: 'center',
          paddingLeft: 10,
        }}>
        <Image source={source} />
      </TouchableOpacity>,
      this.methods.togglePlayPause,
      styles.controls.playPause,
    );
  }
  renderCenterPlayPause() {
    let source =
      this.state.paused === true
        ? require('./assets/img/play.png')
        : require('./assets/img/pause.png');
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.methods.togglePlayPause()}
        style={{
          width: '100%',
          justifyContent: 'center',
          borderRadius: 50,
        }}>
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            height: 30,
            width: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
          }}>
          <Image source={source} />
        </View>
      </TouchableOpacity>,
      this.methods.togglePlayPause,
      styles.controls.centerPlayPause,
    );
  }
  renderCenterPlayNext() {
    let source = require('./assets/img/play.png');
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.methods.togglePlayNext()}
        style={{
          width: '100%',
          justifyContent: 'center',
          borderRadius: 50,
        }}>
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            height: 30,
            width: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
          }}>
          <Image source={source} />
        </View>
      </TouchableOpacity>,
    );
  }
  renderCenterPlayBack() {
    let source = require('./assets/img/play.png');
    return this.renderControl(
      <TouchableOpacity
        onPress={() => this.methods.togglePlayBack()}
        style={{
          width: '100%',
          justifyContent: 'center',
          borderRadius: 50,
          transform: [{rotate: '180deg'}],
        }}>
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            height: 30,
            width: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
          }}>
          <Image source={source} />
        </View>
      </TouchableOpacity>,
    );
  }

  /**
   * Render the play/pause button and show the respective icon
   */
  playLottieRef() {
    this.lottieRef.current.play();
  }
  renderLike() {
    let source =
      this.state.like === true
        ? require('./assets/img/ico_heart_off.png')
        : require('./assets/img/ico_heart_on.png');
    const lottieSource = require('./assets/img/data.json');
    const {lottieRef, playLottieRef} = this;
    const likeYn = this.state.like;
    return (
      <TouchableOpacity
        onPress={() => {
          this.methods.toggleLike();
          playLottieRef;
        }}
        style={{
          width: '100%',
          height: this.props.isPortrait === 'N' ? 27.5 : 27.5,
          alignItems: 'center',
          justifyContent:
            this.props.isPortrait === 'N' ? 'flex-end' : 'flex-start',
        }}>
        {likeYn === false ? (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: this.props.isPortrait === 'Y' ? 20 : -5,
            }}>
            <LottieView
              ref={lottieRef}
              style={{width: 50, height: 50}}
              source={lottieSource}
              autoPlay={true}
              loop={false}
            />
          </View>
        ) : (
          <View>
            <Image source={source} style={{width: 30, height: 30}} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  renderSub() {
    let source =
      this.state.subCc === true
        ? require('./assets/img/ico_cc_on.png')
        : require('./assets/img/ico_cc_off.png');
    return (
      <TouchableOpacity
        onPress={() => this.methods.toggleSubCc()}
        style={{
          display: this.props.vttYn === true ? 'flex' : 'none',
          width: '100%',
          height: this.props.isPortrait === 'N' ? 27.5 : 27.5,
          alignItems: 'center',
          justifyContent:
            this.props.isPortrait === 'N' ? 'flex-end' : 'flex-start',
        }}>
        <Image source={source} style={{width: 30, height: 30}} />
      </TouchableOpacity>
    );
  }

  renderViewIcon() {
    let source = require('./assets/img/icoViewGray.png');
    return (
      <View
        style={{
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image
          source={source}
          style={{width: 15, height: 15, marginRight: 6}}
        />
      </View>
    );
  }
  /**
   * Render our title...if supplied.
   */
  renderTitle() {
    if (this.opts.title) {
      return (
        <View style={[styles.controls.control, styles.controls.title]}>
          <Text
            style={[styles.controls.text, styles.controls.titleText]}
            numberOfLines={1}>
            {this.opts.title || ''}
          </Text>
        </View>
      );
    }

    return null;
  }
  renderTopTitle() {
    if (this.opts.title) {
      return (
        <View style={[styles.controls.control, styles.controls.titleTop]}>
          {this.props.isPortrait === 'N' ? (
            <TextTicker
              style={[styles.controls.textTop]}
              duration={10000} // 기본세팅 3000
              loop
              bounce
              repeatSpacer={50}
              marqueeDelay={1000}>
              {this.opts.title || ''}
            </TextTicker>
          ) : (
            <TextTicker
              style={[styles.controls.textTop]}
              duration={10000} // 기본세팅 3000
              loop
              bounce
              repeatSpacer={50}
              marqueeDelay={1000}>
              {this.opts.title || ''}
            </TextTicker>
          )}
        </View>
      );
    }

    return null;
  }
  renderLikeCnt() {
    if (!isNaN(this.opts.likeCnt)) {
      return (
        <View style={{width: '100%', height: 20, justifyContent: 'flex-start'}}>
          <Text style={styles.controls.likeText} numberOfLines={1}>
            {this.opts.likeCnt === 0 ? '' : this.opts.likeCnt}
          </Text>
        </View>
      );
    }
    if (this.opts.likeCnt !== '') {
      return (
        <View style={{width: 50, height: 40, justifyContent: 'flex-start'}}>
          <Text style={styles.controls.likeText} numberOfLines={1}>
            {this.opts.likeCnt === 0 ? '' : this.opts.likeCnt}
          </Text>
        </View>
      );
    }

    return null;
  }
  renderPlayCnt() {
    if (!isNaN(this.opts.playCnt)) {
      return (
        <View>
          <Text
            style={[styles.controls.text, styles.controls.titleText]}
            numberOfLines={1}>
            {this.opts.playCnt}
          </Text>
        </View>
      );
    }
    if (this.opts.playCnt !== '') {
      return (
        <View>
          <Text
            style={[styles.controls.text, styles.controls.titleText]}
            numberOfLines={1}>
            {this.opts.playCnt}
          </Text>
        </View>
      );
    }

    return null;
  }

  renderUserName() {
    if (this.opts.userName !== '') {
      return (
        <View>
          <Text
            style={[styles.controls.text, styles.controls.titleText]}
            numberOfLines={1}>
            {this.opts.userName} |
          </Text>
        </View>
      );
    }

    return null;
  }

  /**
   * Show our timer.
   */
  renderTimer() {
    return this.renderControl(
      <Text style={styles.controls.timerText}>{this.calculateTime()}</Text>,
      this.methods.toggleTimer,
      styles.controls.timer,
    );
  }

  /**
   * Show loading icon
   */
  renderLoader() {
    if (this.state.loading) {
      return (
        <View style={styles.loader.container}>
          <Animated.Image
            source={require('./assets/img/loader-icon.png')}
            style={[
              styles.loader.icon,
              {
                transform: [
                  {
                    rotate: this.animations.loader.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      );
    }
    return null;
  }

  renderError() {
    if (this.state.error) {
      return (
        <View style={styles.error.container}>
          <Image
            source={require('./assets/img/error-icon.png')}
            style={styles.error.icon}
          />
          <Text style={styles.error.text}>Video unavailable</Text>
        </View>
      );
    }
    return null;
  }

  /**
   * Provide all of our options and render the whole component.
   */
  render() {
    return (
      <TouchableWithoutFeedback
        onPress={this.events.onScreenTouch}
        style={[styles.player.container, this.styles.containerStyle]}>
        <View style={[styles.player.container, this.styles.containerStyle]}>
          <Video
            {...this.props}
            ref={videoPlayer => (this.player.ref = videoPlayer)}
            resizeMode={this.state.resizeMode}
            volume={this.state.volume}
            paused={this.state.paused}
            muted={this.state.muted}
            rate={this.state.rate}
            onLoadStart={this.events.onLoadStart}
            onProgress={this.events.onProgress}
            onError={this.events.onError}
            onLoad={this.events.onLoad}
            onEnd={this.events.onEnd}
            onSeek={this.events.onSeek}
            style={
              this.props.isPortrait === 'Y'
                ? [styles.player.isPortraitVideo, this.styles.videoStyle]
                : [styles.player.video, this.styles.videoStyle]
            }
            source={this.props.source}
          />
          {this.renderError()}
          {this.renderLoader()}
          {this.renderTopControls()}
          {this.renderCenterControls()}
          {this.renderBottomControls()}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

/**
 * This object houses our styles. There's player
 * specific styles and control specific ones.
 * And then there's volume/seeker styles.
 */

const styles = {
  player: StyleSheet.create({
    container: {
      overflow: 'hidden',
      backgroundColor: '#000',
      flex: 1,
      alignSelf: 'stretch',
      justifyContent: 'space-between',
    },
    video: {
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    isPortraitVideo: {
      overflow: 'hidden',
      position: 'absolute',
      top: 30,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: 'rgba( 0, 0, 0, 0.5 )',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      marginBottom: 16,
    },
    text: {
      backgroundColor: 'transparent',
      color: '#f27474',
    },
  }),
  loader: StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  controls: StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: null,
      width: null,
    },
    column: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: null,
      width: null,
    },
    vignette: {
      resizeMode: 'stretch',
    },
    control: {
      padding: 0,
    },
    text: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 14,
    },
    textTop:
      Platform.OS === 'ios'
        ? {
            backgroundColor: 'transparent',
            color: '#FFF',
            fontSize: 20,
          }
        : {
            backgroundColor: 'transparent',
            color: '#FFF',
            fontSize: 25,
          },
    likeText: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 14,
      textAlign: 'center',
    },
    pullRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pullRightCenter: {
      flexDirection: 'row',
    },
    topCenter: {
      alignItems: 'center',
      flexDirection: 'column',
      width: '70%',
    },
    topCenterPortrait: {
      alignItems: 'center',
      flexDirection: 'column',
      width: '45%',
      paddingTop: 11,
    },
    topTitleCenter: {
      width: '100%',
    },
    topTitleCenterPortrait: {
      width: '100%',
    },
    ViewCenter: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      width: '100%',
      height: 40,
    },
    ViewCenterPortrait: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      width: '100%',
      height: 20,
    },
    top: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
    center: {
      flex: 3,
      alignItems: 'stretch',
      justifyContent: 'center',
    },
    bottom: {
      alignItems: 'stretch',
      flex: 1,
      justifyContent: 'flex-end',
    },
    topControlGroup: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: 'row',
      width: null,
      margin: 12,
      marginBottom: 18,
    },
    topControlGroupPortrait: {
      flexDirection: 'row',
      width: null,
    },
    centerControlGroup: {
      alignSelf: 'stretch',
      justifyContent: 'space-between',
      flexDirection: 'row',
      width: null,
      height: '100%',
      margin: 12,
      marginBottom: 18,
    },
    bottomControlGroup: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: 12,
      marginRight: 12,
      marginBottom: 30,
    },
    volume: {
      flexDirection: 'row',
    },
    fullscreen: {
      flexDirection: 'row',
    },
    playPause: {
      position: 'relative',
      width: 80,
      zIndex: 0,
    },
    centerPlayPause: {
      position: 'relative',
      zIndex: 0,
    },
    title: {
      alignItems: 'center',
      flex: 0.6,
      flexDirection: 'column',
      padding: 0,
    },
    titleTop: {
      width: '100%',
    },
    titleText:
      Platform.OS === 'ios'
        ? {
            textAlign: 'center',
            fontSize: 12,
          }
        : {
            textAlign: 'center',
            fontSize: 15,
          },
    timer: {
      width: 80,
    },
    timerText: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 11,
      textAlign: 'right',
    },
  }),
  volume: StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      height: 1,
      marginLeft: 20,
      marginRight: 20,
      width: 150,
    },
    track: {
      backgroundColor: '#333',
      height: 1,
      marginLeft: 7,
    },
    fill: {
      backgroundColor: '#FFF',
      height: 1,
    },
    handle: {
      position: 'absolute',
      marginTop: -24,
      marginLeft: -24,
      padding: 16,
    },
    icon: {
      marginLeft: 7,
    },
  }),
  seekbar: StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      height: 28,
      marginLeft: 20,
      marginRight: 20,
    },
    track: {
      backgroundColor: '#333',
      height: 1,
      position: 'relative',
      top: 14,
      width: '100%',
    },
    fill: {
      backgroundColor: '#FFF',
      height: 1,
      width: '100%',
    },
    handle: {
      position: 'absolute',
      marginLeft: -7,
      height: 28,
      width: 28,
    },
    circle: {
      borderRadius: 12,
      position: 'relative',
      top: 8,
      left: 8,
      height: 12,
      width: 12,
    },
  }),
};
