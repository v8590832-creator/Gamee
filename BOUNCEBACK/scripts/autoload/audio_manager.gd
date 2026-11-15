extends Node

## Centralized Godot 4 AudioManager preserving FAHH MP3 signature audio + synthesized arcade SFX & Indian pentatonic BGM.

const FAHH_PATH := "res://assets/sounds/fahhh.mp3"
const MIX_RATE := 22050
const FAHH_COOLDOWN_MS := 2600
const FAHH_PREVIEW_COOLDOWN_MS := 500

var _fahh_player: AudioStreamPlayer
var _music_player: AudioStreamPlayer
var _sfx_pool: Array[AudioStreamPlayer] = []
var _sfx_cursor := 0
var _sfx_streams: Dictionary = {}

var _music_timer: Timer
var _music_step := 0
var _base_hz := 55.0
var _music_active := false

var _last_fahh_ms := -999999
var _pending_fahh_timer: SceneTreeTimer = null

var _muted := false
var _master_vol := 0.75
var _music_vol := 0.50
var _sfx_vol := 0.85
var _fahh_enabled := true


func _ready() -> void:
	_fahh_player = AudioStreamPlayer.new()
	_fahh_player.name = "FahhPlayer"
	if ResourceLoader.exists(FAHH_PATH):
		_fahh_player.stream = load(FAHH_PATH)
	add_child(_fahh_player)

	_music_player = AudioStreamPlayer.new()
	_music_player.name = "MusicPlayer"
	add_child(_music_player)

	for i in range(10):
		var p := AudioStreamPlayer.new()
		p.name = "SfxPlayer_%d" % i
		add_child(p)
		_sfx_pool.append(p)

	_build_procedural_sfx_bank()

	_music_timer = Timer.new()
	_music_timer.wait_time = 0.65
	_music_timer.timeout.connect(_on_music_tick)
	add_child(_music_timer)

	SaveManager.settings_changed.connect(_sync_from_settings)
	_sync_from_settings()


func _sync_from_settings() -> void:
	var s: Dictionary = SaveManager.settings
	_muted = bool(s.get("muted", false))
	_master_vol = float(s.get("masterVolume", 0.75))
	_music_vol = float(s.get("musicVolume", 0.50))
	_sfx_vol = float(s.get("sfxVolume", 0.85))
	_fahh_enabled = bool(s.get("fahhEnabled", true))
	_apply_volumes()


func _apply_volumes() -> void:
	var master := 0.0 if _muted else _master_vol
	var sfx_lin := master * _sfx_vol * 0.78
	var mus_lin := master * _music_vol * 0.32
	var fahh_lin := master * _sfx_vol * (1.0 if _fahh_enabled else 0.0)

	_fahh_player.volume_db = linear_to_db(maxf(0.0001, fahh_lin)) if fahh_lin > 0.001 else -80.0
	_music_player.volume_db = linear_to_db(maxf(0.0001, mus_lin)) if mus_lin > 0.001 else -80.0
	for p in _sfx_pool:
		p.volume_db = linear_to_db(maxf(0.0001, sfx_lin)) if sfx_lin > 0.001 else -80.0
	if _muted or not _fahh_enabled:
		_fahh_player.stop()


func set_muted(muted_val: bool) -> void:
	_muted = muted_val
	SaveManager.update_settings({"muted": muted_val})


func is_muted() -> bool:
	return _muted


func set_world_profile(base_hz: float) -> void:
	_base_hz = clampf(base_hz, 38.0, 90.0)


func set_music_playing(active: bool) -> void:
	_music_active = active
	if active:
		if _music_timer.is_stopped():
			_music_timer.start()
	else:
		_music_timer.stop()
		_music_player.stop()


func silence_loops() -> void:
	set_music_playing(false)


func _on_music_tick() -> void:
	if not _music_active or _muted or _master_vol <= 0.001 or _music_vol <= 0.001:
		return
	var ratios := [1.0, 1.125, 1.25, 1.5, 1.667, 2.0, 1.667, 1.25]
	var ratio: float = ratios[_music_step % ratios.size()]
	_music_step += 1
	var hz := _base_hz * 2.0 * ratio
	_music_player.stream = _synth_tone(hz, hz * 0.99, 0.42, "triangle", 0.28)
	_music_player.play()


func can_trigger_fahh(reason: String) -> bool:
	if _muted or not _fahh_enabled or _fahh_player.stream == null:
		return false
	if _master_vol <= 0.001 or _sfx_vol <= 0.001:
		return false
	var now_ms := Time.get_ticks_msec()
	var cooldown := FAHH_PREVIEW_COOLDOWN_MS if reason == "preview" else FAHH_COOLDOWN_MS
	return now_ms - _last_fahh_ms >= cooldown


func play_fahh(reason: String, delay_sec := 0.0) -> bool:
	if not can_trigger_fahh(reason):
		return false
	_last_fahh_ms = Time.get_ticks_msec()
	if delay_sec > 0.0:
		_pending_fahh_timer = get_tree().create_timer(delay_sec)
		_pending_fahh_timer.timeout.connect(func() -> void:
			_dispatch_fahh(reason)
		)
	else:
		_dispatch_fahh(reason)
	return true


func preview_fahh() -> bool:
	return play_fahh("preview", 0.0)


func _dispatch_fahh(reason: String) -> void:
	if _muted or not _fahh_enabled or _fahh_player.stream == null:
		return
	_fahh_player.stop()
	_fahh_player.pitch_scale = 1.0 if reason == "preview" else randf_range(0.985, 1.015)
	_apply_volumes()
	_fahh_player.play()


func _play_sfx(key: String, pitch := 1.0) -> void:
	if _muted or _master_vol <= 0.001 or _sfx_vol <= 0.001:
		return
	var stream: AudioStream = _sfx_streams.get(key, null)
	if stream == null:
		return
	var player: AudioStreamPlayer = _sfx_pool[_sfx_cursor % _sfx_pool.size()]
	_sfx_cursor += 1
	player.stream = stream
	player.pitch_scale = clampf(pitch, 0.5, 2.2)
	player.play()


func play_jump(is_double := false) -> void:
	_play_sfx("double_jump" if is_double else "jump", randf_range(0.97, 1.03))


func play_slide() -> void:
	_play_sfx("slide")


func play_bounce(intensity := 1.0) -> void:
	_play_sfx("bounce", clampf(intensity, 0.75, 1.35))


func play_dash() -> void:
	_play_sfx("dash")


func play_special() -> void:
	_play_sfx("special")


func play_horn() -> void:
	_play_sfx("horn", randf_range(0.95, 1.05))


func play_damage() -> void:
	_play_sfx("damage")


func play_thunder() -> void:
	_play_sfx("thunder")


func play_gravity_shift(inverted: bool) -> void:
	_play_sfx("gravity", 1.15 if inverted else 0.9)


func play_portal() -> void:
	_play_sfx("portal")


func play_collectible(combo_index := 0, is_rare := false) -> void:
	var pentatonic := [1.0, 1.122, 1.26, 1.498, 1.682, 2.0]
	var pitch: float = pentatonic[combo_index % pentatonic.size()] * (1.22 if is_rare else 1.0)
	_play_sfx("collectible", pitch)


func play_checkpoint() -> void:
	_play_sfx("checkpoint")


func play_switch() -> void:
	_play_sfx("switch")


func play_fall() -> void:
	_play_sfx("fall")


func play_victory() -> void:
	_play_sfx("victory")


func play_ui_click() -> void:
	_play_sfx("ui_click")


func _build_procedural_sfx_bank() -> void:
	_sfx_streams["jump"] = _synth_tone(195.0, 410.0, 0.16, "triangle", 0.55)
	_sfx_streams["double_jump"] = _synth_tone(290.0, 610.0, 0.18, "triangle", 0.58)
	_sfx_streams["slide"] = _synth_tone(175.0, 75.0, 0.22, "sawtooth", 0.35)
	_sfx_streams["bounce"] = _synth_tone(130.0, 620.0, 0.25, "triangle", 0.65)
	_sfx_streams["dash"] = _synth_tone(480.0, 160.0, 0.22, "sawtooth", 0.45)
	_sfx_streams["special"] = _synth_tone(330.0, 880.0, 0.32, "triangle", 0.55)
	_sfx_streams["horn"] = _synth_chord([310.0, 390.0], 0.18, "sawtooth", 0.32)
	_sfx_streams["damage"] = _synth_tone(145.0, 52.0, 0.28, "sawtooth", 0.6)
	_sfx_streams["thunder"] = _synth_tone(78.0, 32.0, 0.75, "sawtooth", 0.42)
	_sfx_streams["gravity"] = _synth_tone(200.0, 380.0, 0.28, "sine", 0.55)
	_sfx_streams["portal"] = _synth_tone(330.0, 790.0, 0.32, "sine", 0.55)
	_sfx_streams["collectible"] = _synth_chord([523.25, 784.0], 0.22, "sine", 0.5)
	_sfx_streams["checkpoint"] = _synth_chord([392.0, 587.33], 0.32, "sine", 0.52)
	_sfx_streams["switch"] = _synth_tone(260.0, 520.0, 0.14, "square", 0.36)
	_sfx_streams["fall"] = _synth_tone(220.0, 65.0, 0.34, "sawtooth", 0.48)
	_sfx_streams["victory"] = _synth_arpeggio([440.0, 554.37, 659.25, 880.0, 1046.5], 0.52)
	_sfx_streams["ui_click"] = _synth_tone(620.0, 440.0, 0.06, "sine", 0.32)


func _synth_tone(f0: float, f1: float, dur: float, wave: String, gain: float) -> AudioStreamWAV:
	var n := maxi(64, int(dur * MIX_RATE))
	var buf := PackedByteArray()
	buf.resize(n * 2)
	var phase := 0.0
	for i in range(n):
		var t := float(i) / float(n)
		var hz := lerpf(f0, f1, t)
		phase += hz / float(MIX_RATE)
		var env := minf(1.0, t * 18.0) * pow(1.0 - t, 1.45)
		var s := _sample_wave(wave, phase) * env * gain
		var v := clampi(int(s * 32767.0), -32767, 32767)
		buf.encode_s16(i * 2, v)
	return _make_wav(buf)


func _synth_chord(freqs: Array, dur: float, wave: String, gain: float) -> AudioStreamWAV:
	var n := maxi(64, int(dur * MIX_RATE))
	var buf := PackedByteArray()
	buf.resize(n * 2)
	var phases := PackedFloat64Array()
	phases.resize(freqs.size())
	for i in range(n):
		var t := float(i) / float(n)
		var env := minf(1.0, t * 22.0) * pow(1.0 - t, 1.6)
		var sum := 0.0
		for j in range(freqs.size()):
			phases[j] += float(freqs[j]) / float(MIX_RATE)
			sum += _sample_wave(wave, phases[j])
		var s := (sum / maxf(1.0, float(freqs.size()))) * env * gain
		var v := clampi(int(s * 32767.0), -32767, 32767)
		buf.encode_s16(i * 2, v)
	return _make_wav(buf)


func _synth_arpeggio(freqs: Array, dur: float) -> AudioStreamWAV:
	var n := maxi(128, int(dur * MIX_RATE))
	var buf := PackedByteArray()
	buf.resize(n * 2)
	var step_len := n / maxi(1, freqs.size())
	var phase := 0.0
	for i in range(n):
		var idx := mini(freqs.size() - 1, i / maxi(1, step_len))
		var local_t := float(i % maxi(1, step_len)) / float(maxi(1, step_len))
		var hz := float(freqs[idx])
		phase += hz / float(MIX_RATE)
		var env := minf(1.0, local_t * 14.0) * (1.0 - local_t * 0.45)
		var s := _sample_wave("triangle", phase) * env * 0.55
		var v := clampi(int(s * 32767.0), -32767, 32767)
		buf.encode_s16(i * 2, v)
	return _make_wav(buf)


func _sample_wave(wave: String, phase: float) -> float:
	var frac: float = phase - floor(phase)
	match wave:
		"triangle":
			return 4.0 * absf(frac - 0.5) - 1.0
		"sawtooth":
			return 2.0 * frac - 1.0
		"square":
			return 1.0 if frac < 0.5 else -1.0
		_:
			return sin(frac * TAU)


func _make_wav(pcm16: PackedByteArray) -> AudioStreamWAV:
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = MIX_RATE
	wav.stereo = false
	wav.data = pcm16
	return wav
