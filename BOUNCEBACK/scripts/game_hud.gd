extends CanvasLayer

## Gameplay HUD overlay + responsive Mobile/Touch virtual joystick & action buttons.

var _root: Control
var _stage_label: Label
var _health_label: Label
var _checkpoint_label: Label
var _timer_label: Label
var _challenge_timer_label: Label
var _boss_label: Label
var _score_label: Label
var _coins_label: Label
var _items_label: Label
var _mute_btn: Button

var _notice_panel: PanelContainer
var _notice_label: Label
var _hint_panel: PanelContainer
var _hint_label: Label
var _interact_panel: PanelContainer
var _interact_label: Label

var _speed_label: Label
var _bounce_bar: ProgressBar
var _dash_bar: ProgressBar
var _special_bar: ProgressBar

# Touch Controls
var _touch_layer: Control
var _joy_base: Control
var _joy_knob: ColorRect
var _joy_touch_idx := -1
var _joy_center := Vector2.ZERO
const JOY_RADIUS := 54.0


func _ready() -> void:
	layer = 5
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_hud()
	GameManager.game_state_changed.connect(_on_state_changed)
	GameManager.hud_updated.connect(_on_hud_updated)
	SaveManager.settings_changed.connect(_refresh_touch_visibility)
	_on_state_changed(GameManager.game_state)
	_refresh_touch_visibility()


func _build_hud() -> void:
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)

	# Top Bar Container
	var top_margin := MarginContainer.new()
	top_margin.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top_margin.add_theme_constant_override("margin_left", 18)
	top_margin.add_theme_constant_override("margin_right", 18)
	top_margin.add_theme_constant_override("margin_top", 14)
	top_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(top_margin)

	var top_hbox := HBoxContainer.new()
	top_hbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_hbox.add_theme_constant_override("separation", 12)
	top_margin.add_child(top_hbox)

	# Top Left Card: Stage & Health
	var left_panel := PanelContainer.new()
	GameManager.style_panel(left_panel, Color(0.055, 0.072, 0.105, 0.84), Color(0.898, 0.604, 0.235, 0.35), 10)
	top_hbox.add_child(left_panel)

	var left_v := VBoxContainer.new()
	left_panel.add_child(left_v)

	_stage_label = Label.new()
	_stage_label.text = "WORLD 1 · STAGE 1"
	_stage_label.add_theme_color_override("font_color", Color("#f8f5ee"))
	_stage_label.add_theme_font_size_override("font_size", 15)
	if GameManager.font_display_semibold:
		_stage_label.add_theme_font_override("font", GameManager.font_display_semibold)
	left_v.add_child(_stage_label)

	var hp_cp := HBoxContainer.new()
	hp_cp.add_theme_constant_override("separation", 14)
	left_v.add_child(hp_cp)

	_health_label = Label.new()
	_health_label.text = "HP: ♥♥♥"
	_health_label.add_theme_color_override("font_color", Color("#f87171"))
	if GameManager.font_mono:
		_health_label.add_theme_font_override("font", GameManager.font_mono)
	hp_cp.add_child(_health_label)

	_checkpoint_label = Label.new()
	_checkpoint_label.text = "Start Gantry"
	_checkpoint_label.add_theme_color_override("font_color", Color("#94a3b8"))
	_checkpoint_label.add_theme_font_size_override("font_size", 12)
	hp_cp.add_child(_checkpoint_label)

	# Center Spacer & Timer
	var center_v := VBoxContainer.new()
	center_v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center_v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_hbox.add_child(center_v)

	var timer_panel := PanelContainer.new()
	timer_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	GameManager.style_panel(timer_panel, Color(0.055, 0.072, 0.105, 0.84), Color(1, 1, 1, 0.14), 10)
	center_v.add_child(timer_panel)

	var tv := VBoxContainer.new()
	tv.alignment = BoxContainer.ALIGNMENT_CENTER
	timer_panel.add_child(tv)

	_timer_label = Label.new()
	_timer_label.text = "00:00.0"
	_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_timer_label.add_theme_font_size_override("font_size", 20)
	_timer_label.add_theme_color_override("font_color", Color("#f8f5ee"))
	if GameManager.font_mono:
		_timer_label.add_theme_font_override("font", GameManager.font_mono)
	tv.add_child(_timer_label)

	_challenge_timer_label = Label.new()
	_challenge_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_challenge_timer_label.add_theme_color_override("font_color", Color("#ef4444"))
	_challenge_timer_label.add_theme_font_size_override("font_size", 12)
	_challenge_timer_label.visible = false
	tv.add_child(_challenge_timer_label)

	_boss_label = Label.new()
	_boss_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_boss_label.add_theme_color_override("font_color", Color("#fca5a5"))
	_boss_label.visible = false
	center_v.add_child(_boss_label)

	# Top Right Card: Score, Coins, Collectibles & Utility Buttons
	var right_panel := PanelContainer.new()
	GameManager.style_panel(right_panel, Color(0.055, 0.072, 0.105, 0.84), Color(0.898, 0.604, 0.235, 0.35), 10)
	top_hbox.add_child(right_panel)

	var right_h := HBoxContainer.new()
	right_h.add_theme_constant_override("separation", 12)
	right_panel.add_child(right_h)

	var stats_v := VBoxContainer.new()
	right_h.add_child(stats_v)

	_score_label = Label.new()
	_score_label.text = "SCORE: 1000"
	_score_label.add_theme_color_override("font_color", Color("#f5b832"))
	if GameManager.font_mono:
		_score_label.add_theme_font_override("font", GameManager.font_mono)
	stats_v.add_child(_score_label)

	var sub_r := HBoxContainer.new()
	sub_r.add_theme_constant_override("separation", 10)
	stats_v.add_child(sub_r)

	_coins_label = Label.new()
	_coins_label.text = "COINS: 0"
	_coins_label.add_theme_font_size_override("font_size", 12)
	_coins_label.add_theme_color_override("font_color", Color("#e2e8f0"))
	sub_r.add_child(_coins_label)

	_items_label = Label.new()
	_items_label.text = "ITEMS: 0/0"
	_items_label.add_theme_font_size_override("font_size", 12)
	_items_label.add_theme_color_override("font_color", Color("#38bdf8"))
	sub_r.add_child(_items_label)

	_mute_btn = Button.new()
	_mute_btn.text = "SFX"
	_mute_btn.custom_minimum_size = Vector2(52, 34)
	GameManager.style_button(_mute_btn, false)
	_mute_btn.pressed.connect(func() -> void:
		AudioManager.set_muted(not AudioManager.is_muted())
		_mute_btn.text = "MUTE" if AudioManager.is_muted() else "SFX"
	)
	right_h.add_child(_mute_btn)

	var respawn_btn := Button.new()
	respawn_btn.text = "CP [R]"
	respawn_btn.custom_minimum_size = Vector2(64, 34)
	GameManager.style_button(respawn_btn, false)
	respawn_btn.pressed.connect(func() -> void:
		GameManager.respawn_at_checkpoint()
	)
	right_h.add_child(respawn_btn)

	var pause_btn := Button.new()
	pause_btn.text = "II"
	pause_btn.custom_minimum_size = Vector2(42, 34)
	GameManager.style_button(pause_btn, true)
	pause_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		GameManager.set_game_state("paused")
	)
	right_h.add_child(pause_btn)

	# Transient Center Notice (Checkpoints, Achievements, Challenges)
	_notice_panel = PanelContainer.new()
	_notice_panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_notice_panel.offset_top = 86
	_notice_panel.offset_left = -220
	_notice_panel.offset_right = 220
	_notice_panel.visible = false
	GameManager.style_panel(_notice_panel, Color(0.08, 0.11, 0.16, 0.92), Color("#f5b832"), 10)
	_root.add_child(_notice_panel)

	_notice_label = Label.new()
	_notice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notice_label.add_theme_color_override("font_color", Color("#fef08a"))
	if GameManager.font_display_semibold:
		_notice_label.add_theme_font_override("font", GameManager.font_display_semibold)
	_notice_panel.add_child(_notice_label)

	# Interact Prompt
	_interact_panel = PanelContainer.new()
	_interact_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_interact_panel.offset_bottom = -110
	_interact_panel.offset_top = -152
	_interact_panel.offset_left = -160
	_interact_panel.offset_right = 160
	_interact_panel.visible = false
	GameManager.style_panel(_interact_panel, Color(0.06, 0.09, 0.14, 0.92), Color("#38bdf8"), 8)
	_root.add_child(_interact_panel)

	_interact_label = Label.new()
	_interact_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_interact_label.add_theme_color_override("font_color", Color("#bae6fd"))
	_interact_panel.add_child(_interact_label)

	# Hint Banner
	_hint_panel = PanelContainer.new()
	_hint_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_hint_panel.offset_bottom = -24
	_hint_panel.offset_top = -72
	_hint_panel.offset_left = -280
	_hint_panel.offset_right = 280
	_hint_panel.visible = false
	GameManager.style_panel(_hint_panel, Color(0.05, 0.07, 0.10, 0.85), Color(1, 1, 1, 0.2), 8)
	_root.add_child(_hint_panel)

	_hint_label = Label.new()
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hint_label.add_theme_color_override("font_color", Color("#e2e8f0"))
	_hint_label.add_theme_font_size_override("font_size", 13)
	_hint_panel.add_child(_hint_label)

	# Bottom Right Speedometer & Ability Cooldowns
	var ab_margin := MarginContainer.new()
	ab_margin.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	ab_margin.offset_left = -240
	ab_margin.offset_top = -148
	ab_margin.add_theme_constant_override("margin_right", 18)
	ab_margin.add_theme_constant_override("margin_bottom", 18)
	ab_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(ab_margin)

	var ab_panel := PanelContainer.new()
	GameManager.style_panel(ab_panel, Color(0.055, 0.072, 0.105, 0.84), Color(1, 1, 1, 0.16), 10)
	ab_margin.add_child(ab_panel)

	var ab_v := VBoxContainer.new()
	ab_v.add_theme_constant_override("separation", 5)
	ab_panel.add_child(ab_v)

	_speed_label = Label.new()
	_speed_label.text = "0 km/h"
	_speed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_speed_label.add_theme_color_override("font_color", Color("#e59a3c"))
	if GameManager.font_mono:
		_speed_label.add_theme_font_override("font", GameManager.font_mono)
	ab_v.add_child(_speed_label)

	_bounce_bar = _add_cd_bar(ab_v, "[Q] BOUNCE", Color("#f59e0b"))
	_dash_bar = _add_cd_bar(ab_v, "[V] DASH", Color("#38bdf8"))
	_special_bar = _add_cd_bar(ab_v, "[F] SURGE", Color("#c084fc"))

	_build_touch_controls()


func _add_cd_bar(parent: VBoxContainer, lbl_txt: String, col: Color) -> ProgressBar:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	parent.add_child(row)
	var l := Label.new()
	l.text = lbl_txt
	l.custom_minimum_size = Vector2(82, 0)
	l.add_theme_font_size_override("font_size", 11)
	l.add_theme_color_override("font_color", Color("#cbd5e1"))
	row.add_child(l)
	var pb := ProgressBar.new()
	pb.custom_minimum_size = Vector2(96, 10)
	pb.max_value = 1.0
	pb.value = 1.0
	pb.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	fill.set_corner_radius_all(3)
	pb.add_theme_stylebox_override("fill", fill)
	row.add_child(pb)
	return pb


func _build_touch_controls() -> void:
	_touch_layer = Control.new()
	_touch_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_touch_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_touch_layer)

	_joy_base = Panel.new()
	_joy_base.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	_joy_base.offset_left = 28
	_joy_base.offset_bottom = -28
	_joy_base.offset_right = 164
	_joy_base.offset_top = -164
	GameManager.style_panel(_joy_base, Color(0.08, 0.11, 0.16, 0.45), Color(1, 1, 1, 0.35), 68)
	_touch_layer.add_child(_joy_base)

	_joy_knob = ColorRect.new()
	_joy_knob.color = Color("#e59a3c")
	_joy_knob.custom_minimum_size = Vector2(44, 44)
	_joy_knob.size = Vector2(44, 44)
	_joy_knob.position = Vector2(46, 46)
	_joy_knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_joy_base.add_child(_joy_knob)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	grid.offset_right = -24
	grid.offset_bottom = -168
	grid.offset_left = -286
	grid.offset_top = -316
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	_touch_layer.add_child(grid)

	for spec in [
		["BOUNCE", "bounce"],
		["DASH", "dash"],
		["JUMP", "jump"],
		["SLIDE", "slide"],
		["SURGE", "special"],
		["USE", "interact"]
	]:
		var btn := Button.new()
		btn.text = spec[0]
		btn.custom_minimum_size = Vector2(82, 56)
		GameManager.style_button(btn, spec[1] == "jump")
		var key: String = spec[1]
		btn.button_down.connect(func() -> void:
			_set_main_touch_action(key, true)
		)
		btn.button_up.connect(func() -> void:
			_set_main_touch_action(key, false)
		)
		grid.add_child(btn)


func _input(event: InputEvent) -> void:
	if not visible or not _touch_layer.visible:
		return
	if event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		var rect := _joy_base.get_global_rect()
		if st.pressed and _joy_touch_idx == -1 and rect.has_point(st.position):
			_joy_touch_idx = st.index
			_joy_center = rect.get_center()
			_update_joystick(st.position)
		elif not st.pressed and st.index == _joy_touch_idx:
			_joy_touch_idx = -1
			_joy_knob.position = Vector2(46, 46)
			_set_main_touch_move(Vector2.ZERO)
	elif event is InputEventScreenDrag:
		var sd := event as InputEventScreenDrag
		if sd.index == _joy_touch_idx:
			_update_joystick(sd.position)


func _update_joystick(screen_pos: Vector2) -> void:
	var delta := screen_pos - _joy_center
	if delta.length() > JOY_RADIUS:
		delta = delta.normalized() * JOY_RADIUS
	_joy_knob.position = Vector2(46, 46) + delta
	var norm := delta / JOY_RADIUS
	_set_main_touch_move(Vector2(norm.x, -norm.y))


func _set_main_touch_move(v: Vector2) -> void:
	var main_node := get_tree().current_scene
	if main_node and "touch_move" in main_node:
		main_node.touch_move = v


func _set_main_touch_action(key: String, active: bool) -> void:
	var main_node := get_tree().current_scene
	if main_node and "touch_actions" in main_node:
		main_node.touch_actions[key] = active


func _refresh_touch_visibility() -> void:
	var mode := str(SaveManager.settings.get("touchControlsMode", "auto"))
	if mode == "on":
		_touch_layer.visible = true
	elif mode == "off":
		_touch_layer.visible = false
	else:
		_touch_layer.visible = OS.has_feature("mobile") or DisplayServer.is_touchscreen_available()


func _on_state_changed(state: String) -> void:
	visible = (state == "playing")
	_mute_btn.text = "MUTE" if AudioManager.is_muted() else "SFX"


func _on_hud_updated(hud: Dictionary) -> void:
	_stage_label.text = "%s  ·  %s" % [str(hud.get("worldName", "")).to_upper(), str(hud.get("levelName", ""))]
	var hp := int(hud.get("health", 3))
	var max_hp := int(hud.get("maxHealth", 3))
	_health_label.text = "HP: %s%s" % ["♥".repeat(maxi(0, hp)), "♡".repeat(maxi(0, max_hp - hp))]
	_checkpoint_label.text = str(hud.get("checkpointLabel", "Start Gantry"))

	var t := float(hud.get("elapsedTime", 0.0))
	var mins := int(t) / 60
	var secs := fmod(t, 60.0)
	_timer_label.text = "%02d:%04.1f" % [mins, secs]

	var tc: Variant = hud.get("timeChallengeRemaining", null)
	if tc != null:
		_challenge_timer_label.visible = true
		_challenge_timer_label.text = "TIME LIMIT: %.1fs" % float(tc)
	else:
		_challenge_timer_label.visible = false

	var boss: Variant = hud.get("bossName", null)
	if boss != null and str(boss) != "":
		_boss_label.visible = true
		_boss_label.text = "HAZARD BOSS: %s" % str(boss).to_upper()
	else:
		_boss_label.visible = false

	_score_label.text = "SCORE: %d" % int(hud.get("score", 0))
	_coins_label.text = "COINS: +%d (%d)" % [int(hud.get("coinsRun", 0)), int(hud.get("totalCoins", 0))]
	_items_label.text = "ITEMS: %d/%d" % [int(hud.get("collectiblesFound", 0)), int(hud.get("collectiblesTotal", 0))]

	var notice: Variant = hud.get("checkpointNotice", null)
	if notice != null and str(notice) != "":
		_notice_panel.visible = true
		_notice_label.text = str(notice)
	else:
		_notice_panel.visible = false

	var prompt: Variant = hud.get("interactPrompt", null)
	if prompt != null and str(prompt) != "":
		_interact_panel.visible = true
		_interact_label.text = str(prompt)
	else:
		_interact_panel.visible = false

	var hint: Variant = hud.get("levelHint", null)
	if hint != null and str(hint) != "":
		_hint_panel.visible = true
		_hint_label.text = str(hint)
	else:
		_hint_panel.visible = false

	var kmh := roundi(float(hud.get("speed", 0.0)) * 3.6)
	_speed_label.text = "%d km/h" % kmh
	_bounce_bar.value = 1.0 - float(hud.get("bounceCooldownRatio", 0.0))
	_dash_bar.value = (1.0 - float(hud.get("dashCooldownRatio", 0.0))) if bool(hud.get("canDash", true)) else 0.0
	_special_bar.value = 1.0 if bool(hud.get("specialActive", false)) else (1.0 - float(hud.get("specialCooldownRatio", 0.0)))
