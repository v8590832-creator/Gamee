extends CanvasLayer

## Pause Menu overlay triggered via Escape/P or HUD Pause button.


func _ready() -> void:
	layer = 15
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()
	GameManager.game_state_changed.connect(_on_state_changed)
	_on_state_changed(GameManager.game_state)


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.02, 0.03, 0.05, 0.68)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(360, 0)
	GameManager.style_panel(panel, Color(0.055, 0.072, 0.105, 0.96), Color(0.898, 0.604, 0.235, 0.55), 14)
	center.add_child(panel)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	panel.add_child(v)

	var hdr := Label.new()
	hdr.text = "PAUSED"
	hdr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hdr.add_theme_font_size_override("font_size", 28)
	hdr.add_theme_color_override("font_color", Color("#f8f5ee"))
	if GameManager.font_display:
		hdr.add_theme_font_override("font", GameManager.font_display)
	v.add_child(hdr)

	v.add_child(HSeparator.new())

	_add_btn(v, "RESUME STAGE", true, func() -> void:
		GameManager.set_game_state("playing")
	)
	_add_btn(v, "RESTART STAGE", false, func() -> void:
		GameManager.restart_current_level()
	)
	_add_btn(v, "RESPAWN AT CHECKPOINT", false, func() -> void:
		GameManager.set_game_state("playing")
		GameManager.respawn_at_checkpoint()
	)
	_add_btn(v, "SETTINGS & FAHH AUDIO", false, func() -> void:
		GameManager.open_settings_requested.emit()
	)
	_add_btn(v, "WORLD SELECTION", false, func() -> void:
		GameManager.open_world_select_requested.emit()
	)
	_add_btn(v, "MAIN MENU", false, func() -> void:
		GameManager.set_game_state("title")
	)


func _add_btn(parent: VBoxContainer, txt: String, accent: bool, cb: Callable) -> void:
	var btn := Button.new()
	btn.text = txt
	btn.custom_minimum_size = Vector2(0, 42)
	GameManager.style_button(btn, accent)
	btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		cb.call()
	)
	parent.add_child(btn)


func _on_state_changed(state: String) -> void:
	visible = (state == "paused")
