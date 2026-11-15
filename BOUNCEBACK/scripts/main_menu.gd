extends CanvasLayer

## Main Menu, World Select (10 worlds / 50 stages), Wardrobe & Shop,
## Challenges (20), Achievements (10), Settings (with TEST FAHH + Key Rebinding), and Credits.

var _root: Control
var _backdrop: ColorRect
var _title_panel: PanelContainer
var _modal_backdrop: ColorRect
var _modal_panel: PanelContainer
var _modal_title: Label
var _modal_body: VBoxContainer
var _modal_scroll: ScrollContainer

var _stats_label: Label
var _play_btn: Button
var _last_stage_lbl: Label

var _current_modal := "" # "" | "worlds" | "wardrobe" | "challenges" | "achievements" | "settings" | "credits"
var _selected_world_id := 1
var _selected_wardrobe_cat := "kurta"
var _opened_from_pause := false
var _rebinding_action := ""
var _rebind_buttons: Dictionary = {}
var _confirm_reset := false


func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()

	GameManager.game_state_changed.connect(_on_state_changed)
	GameManager.open_settings_requested.connect(_on_open_settings_from_pause)
	GameManager.open_world_select_requested.connect(_on_open_worlds_from_external)
	SaveManager.save_changed.connect(_refresh_all)
	SaveManager.settings_changed.connect(_refresh_modal_if_settings)

	_on_state_changed(GameManager.game_state)
	_refresh_summary_bar()


func _input(event: InputEvent) -> void:
	if _rebinding_action == "":
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var kev := event as InputEventKey
		get_viewport().set_input_as_handled()
		var act := _rebinding_action
		_rebinding_action = ""
		if kev.physical_keycode != KEY_ESCAPE:
			SaveManager.update_binding(act, int(kev.physical_keycode))
		_rebuild_modal_content()


func _build_ui() -> void:
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)

	_backdrop = ColorRect.new()
	_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	_backdrop.color = Color(0.03, 0.04, 0.06, 0.34)
	_backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_backdrop)

	# Left Editorial Title Column
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	margin.custom_minimum_size = Vector2(440, 0)
	margin.add_theme_constant_override("margin_left", 36)
	margin.add_theme_constant_override("margin_top", 32)
	margin.add_theme_constant_override("margin_bottom", 32)
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(margin)

	_title_panel = PanelContainer.new()
	_title_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	GameManager.style_panel(_title_panel, Color(0.055, 0.072, 0.105, 0.90), Color(0.898, 0.604, 0.235, 0.45), 14)
	margin.add_child(_title_panel)

	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 10)
	_title_panel.add_child(col)

	var badge := Label.new()
	badge.text = "HIGHWAY EDITION  ·  GODOT 4"
	badge.add_theme_color_override("font_color", Color("#e59a3c"))
	badge.add_theme_font_size_override("font_size", 12)
	if GameManager.font_mono:
		badge.add_theme_font_override("font", GameManager.font_mono)
	col.add_child(badge)

	var title := Label.new()
	title.text = "BOUNCEBACK"
	title.add_theme_color_override("font_color", Color("#f8f5ee"))
	title.add_theme_font_size_override("font_size", 42)
	if GameManager.font_display:
		title.add_theme_font_override("font", GameManager.font_display)
	col.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "THE GREAT ROAD ADVENTURE\nOne Man. Countless Roads. Unlimited Bounces."
	subtitle.add_theme_color_override("font_color", Color("#b8c2d1"))
	subtitle.add_theme_font_size_override("font_size", 14)
	if GameManager.font_sans:
		subtitle.add_theme_font_override("font", GameManager.font_sans)
	col.add_child(subtitle)

	_stats_label = Label.new()
	_stats_label.add_theme_color_override("font_color", Color("#f3d28f"))
	_stats_label.add_theme_font_size_override("font_size", 13)
	if GameManager.font_mono:
		_stats_label.add_theme_font_override("font", GameManager.font_mono)
	col.add_child(_stats_label)

	var sep := HSeparator.new()
	col.add_child(sep)

	_play_btn = Button.new()
	_play_btn.text = "PLAY STAGE"
	_play_btn.custom_minimum_size = Vector2(0, 48)
	GameManager.style_button(_play_btn, true)
	_play_btn.add_theme_font_size_override("font_size", 18)
	_play_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		GameManager.start_level(GameManager.current_level_id)
	)
	col.add_child(_play_btn)

	_last_stage_lbl = Label.new()
	_last_stage_lbl.add_theme_color_override("font_color", Color("#94a3b8"))
	_last_stage_lbl.add_theme_font_size_override("font_size", 12)
	if GameManager.font_sans:
		_last_stage_lbl.add_theme_font_override("font", GameManager.font_sans)
	col.add_child(_last_stage_lbl)

	var nav_items := [
		["WORLD SELECT (10 WORLDS · 50 STAGES)", "worlds"],
		["WARDROBE & ROAD SHOP", "wardrobe"],
		["CHALLENGES (20)", "challenges"],
		["ACHIEVEMENTS (10)", "achievements"],
		["SETTINGS & FAHH AUDIO", "settings"],
		["CREDITS & CONTROLS", "credits"]
	]
	for item in nav_items:
		var btn := Button.new()
		btn.text = item[0]
		btn.custom_minimum_size = Vector2(0, 38)
		GameManager.style_button(btn, false)
		var modal_key: String = item[1]
		btn.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			_open_modal(modal_key, false)
		)
		col.add_child(btn)

	if not OS.has_feature("web"):
		var quit_btn := Button.new()
		quit_btn.text = "QUIT TO DESKTOP"
		quit_btn.custom_minimum_size = Vector2(0, 36)
		GameManager.style_button(quit_btn, false, true)
		quit_btn.pressed.connect(func() -> void:
			get_tree().quit()
		)
		col.add_child(quit_btn)

	# Fullscreen Modal Container
	_modal_backdrop = ColorRect.new()
	_modal_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	_modal_backdrop.color = Color(0.02, 0.03, 0.05, 0.78)
	_modal_backdrop.visible = false
	_root.add_child(_modal_backdrop)

	var center := MarginContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.add_theme_constant_override("margin_left", 64)
	center.add_theme_constant_override("margin_right", 64)
	center.add_theme_constant_override("margin_top", 38)
	center.add_theme_constant_override("margin_bottom", 38)
	_modal_backdrop.add_child(center)

	_modal_panel = PanelContainer.new()
	GameManager.style_panel(_modal_panel, Color(0.055, 0.072, 0.105, 0.97), Color(0.898, 0.604, 0.235, 0.55), 14)
	center.add_child(_modal_panel)

	var modal_vbox := VBoxContainer.new()
	modal_vbox.add_theme_constant_override("separation", 12)
	_modal_panel.add_child(modal_vbox)

	var hdr := HBoxContainer.new()
	modal_vbox.add_child(hdr)

	_modal_title = Label.new()
	_modal_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_modal_title.add_theme_color_override("font_color", Color("#f8f5ee"))
	_modal_title.add_theme_font_size_override("font_size", 24)
	if GameManager.font_display:
		_modal_title.add_theme_font_override("font", GameManager.font_display)
	hdr.add_child(_modal_title)

	var close_btn := Button.new()
	close_btn.text = "CLOSE"
	close_btn.custom_minimum_size = Vector2(100, 36)
	GameManager.style_button(close_btn, false)
	close_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		_close_modal()
	)
	hdr.add_child(close_btn)

	modal_vbox.add_child(HSeparator.new())

	_modal_scroll = ScrollContainer.new()
	_modal_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_modal_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	modal_vbox.add_child(_modal_scroll)

	_modal_body = VBoxContainer.new()
	_modal_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_modal_body.add_theme_constant_override("separation", 12)
	_modal_scroll.add_child(_modal_body)


func _on_state_changed(state: String) -> void:
	if state == "title":
		visible = true
		_title_panel.visible = true
		_backdrop.visible = true
		_opened_from_pause = false
		_refresh_summary_bar()
	elif _opened_from_pause and _current_modal == "settings":
		visible = true
		_title_panel.visible = false
		_backdrop.visible = false
	else:
		visible = false
		_close_modal()


func _on_open_settings_from_pause() -> void:
	_opened_from_pause = true
	visible = true
	_title_panel.visible = false
	_backdrop.visible = false
	_open_modal("settings", true)


func _on_open_worlds_from_external() -> void:
	_opened_from_pause = false
	GameManager.set_game_state("title")
	_open_modal("worlds", false)


func _open_modal(key: String, from_pause: bool) -> void:
	_current_modal = key
	_opened_from_pause = from_pause
	_rebinding_action = ""
	_confirm_reset = false
	_modal_backdrop.visible = true
	_rebuild_modal_content()


func _close_modal() -> void:
	_current_modal = ""
	_rebinding_action = ""
	_confirm_reset = false
	_modal_backdrop.visible = false
	if _opened_from_pause:
		_opened_from_pause = false
		if GameManager.game_state != "title":
			visible = false


func _refresh_all() -> void:
	_refresh_summary_bar()
	if _current_modal != "" and _current_modal != "settings":
		_rebuild_modal_content()


func _refresh_modal_if_settings() -> void:
	if _current_modal == "settings" and _rebinding_action == "":
		_rebuild_modal_content()


func _refresh_summary_bar() -> void:
	var coins := int(SaveManager.data.get("coins", 0))
	var stars := SaveManager.get_total_stars()
	var max_stars := GameManager.levels.size() * 3
	var best := SaveManager.get_best_score()
	_stats_label.text = "COINS: %d  ·  STARS: %d/%d ★  ·  BEST: %d" % [coins, stars, max_stars, best]

	var cur_lvl := GameManager.get_level_by_id(GameManager.current_level_id)
	var w := GameManager.get_world_theme(int(cur_lvl.get("worldId", 1)))
	_play_btn.text = "PLAY  ·  %s" % str(cur_lvl.get("name", "Stage 1")).to_upper()
	_last_stage_lbl.text = "World %d: %s  (Par %.0fs)" % [int(cur_lvl.get("worldId", 1)), str(w.get("name", "")), float(cur_lvl.get("parTime", 30.0))]


func _clear_modal_body() -> void:
	for c in _modal_body.get_children():
		c.queue_free()
	_rebind_buttons.clear()


func _rebuild_modal_content() -> void:
	_clear_modal_body()
	match _current_modal:
		"worlds":
			_modal_title.text = "WORLD SELECT  ·  10 WORLDS · 50 STAGES"
			_build_worlds_modal()
		"wardrobe":
			_modal_title.text = "WARDROBE & ROAD SHOP"
			_build_wardrobe_modal()
		"challenges":
			_modal_title.text = "ROAD CHALLENGES (%d / %d)" % [SaveManager.data.get("completedChallenges", []).size(), GameManager.challenges.size()]
			_build_challenges_modal()
		"achievements":
			_modal_title.text = "ACHIEVEMENTS (%d / %d)" % [SaveManager.data.get("unlockedAchievements", []).size(), GameManager.achievements.size()]
			_build_achievements_modal()
		"settings":
			_modal_title.text = "SETTINGS & AUDIO"
			_build_settings_modal()
		"credits":
			_modal_title.text = "BOUNCEBACK  ·  CONTROLS & CREDITS"
			_build_credits_modal()


func _build_worlds_modal() -> void:
	var top_bar := HBoxContainer.new()
	top_bar.add_theme_constant_override("separation", 10)
	_modal_body.add_child(top_bar)

	var unlock_all := bool(SaveManager.data.get("unlockAllShowcase", false))
	var toggle_all := CheckButton.new()
	toggle_all.button_pressed = unlock_all
	toggle_all.text = "Showcase Mode: All 50 Stages Unlocked"
	toggle_all.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		SaveManager.toggle_showcase_unlock_all()
	)
	top_bar.add_child(toggle_all)

	var worlds_grid := GridContainer.new()
	worlds_grid.columns = 5
	worlds_grid.add_theme_constant_override("h_separation", 8)
	worlds_grid.add_theme_constant_override("v_separation", 8)
	_modal_body.add_child(worlds_grid)

	for w in GameManager.worlds:
		var wid := int(w.get("id", 1))
		var w_btn := Button.new()
		w_btn.text = "W%d: %s" % [wid, str(w.get("name", ""))]
		w_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		w_btn.custom_minimum_size = Vector2(0, 38)
		GameManager.style_button(w_btn, wid == _selected_world_id)
		w_btn.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			_selected_world_id = wid
			_rebuild_modal_content()
		)
		worlds_grid.add_child(w_btn)

	var theme := GameManager.get_world_theme(_selected_world_id)
	var w_info := PanelContainer.new()
	GameManager.style_panel(w_info, Color(0.08, 0.11, 0.16, 0.9), Color.html(str(theme.get("accentColor", "#e59a3c"))), 10)
	_modal_body.add_child(w_info)

	var w_box := VBoxContainer.new()
	w_info.add_child(w_box)
	var w_hdr := Label.new()
	w_hdr.text = "WORLD %d  ·  %s" % [_selected_world_id, str(theme.get("name", "")).to_upper()]
	w_hdr.add_theme_font_size_override("font_size", 18)
	w_hdr.add_theme_color_override("font_color", Color("#f8f5ee"))
	if GameManager.font_display:
		w_hdr.add_theme_font_override("font", GameManager.font_display)
	w_box.add_child(w_hdr)

	var w_desc := Label.new()
	w_desc.text = str(theme.get("description", ""))
	w_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	w_desc.add_theme_color_override("font_color", Color("#cbd5e1"))
	w_box.add_child(w_desc)

	var stages := GameManager.get_levels_for_world(_selected_world_id)
	var prog: Dictionary = SaveManager.data.get("levelProgress", {})
	for lvl in stages:
		var lid := str(lvl.get("id", ""))
		var unlocked := SaveManager.is_level_unlocked(lid)
		var lprog: Dictionary = prog.get(lid, {})
		var stars := int(lprog.get("stars", 0))
		var best := int(lprog.get("bestScore", 0))

		var card := PanelContainer.new()
		GameManager.style_panel(card, Color(0.075, 0.095, 0.135, 0.95), Color(1, 1, 1, 0.14), 8)
		_modal_body.add_child(card)

		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		card.add_child(row)

		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(info)

		var name_lbl := Label.new()
		var star_str := ("★".repeat(stars)) + ("☆".repeat(3 - stars))
		name_lbl.text = "%d.%d  %s   [%s]" % [_selected_world_id, int(lvl.get("levelNumber", 1)), str(lvl.get("name", "")), star_str]
		name_lbl.add_theme_font_size_override("font_size", 16)
		name_lbl.add_theme_color_override("font_color", Color("#f8f5ee") if unlocked else Color("#64748b"))
		if GameManager.font_display_semibold:
			name_lbl.add_theme_font_override("font", GameManager.font_display_semibold)
		info.add_child(name_lbl)

		var sub_lbl := Label.new()
		sub_lbl.text = "%s  |  Par: %.0fs  |  Best: %d" % [str(lvl.get("subtitle", "")), float(lvl.get("parTime", 30.0)), best]
		sub_lbl.add_theme_font_size_override("font_size", 12)
		sub_lbl.add_theme_color_override("font_color", Color("#94a3b8"))
		info.add_child(sub_lbl)

		var prev_btn := Button.new()
		prev_btn.text = "PREVIEW"
		prev_btn.disabled = not unlocked
		prev_btn.custom_minimum_size = Vector2(96, 36)
		GameManager.style_button(prev_btn, false)
		prev_btn.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			GameManager.preview_level(lid)
			_close_modal()
		)
		row.add_child(prev_btn)

		var play_stage_btn := Button.new()
		play_stage_btn.text = "PLAY" if unlocked else "LOCKED"
		play_stage_btn.disabled = not unlocked
		play_stage_btn.custom_minimum_size = Vector2(96, 36)
		GameManager.style_button(play_stage_btn, unlocked)
		play_stage_btn.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			_close_modal()
			GameManager.start_level(lid)
		)
		row.add_child(play_stage_btn)


func _build_wardrobe_modal() -> void:
	var wallet := Label.new()
	wallet.text = "ROAD COINS: %d   ·   BLUEPRINTS RECOVERED: %d" % [int(SaveManager.data.get("coins", 0)), int(SaveManager.data.get("blueprintsCollected", 0))]
	wallet.add_theme_color_override("font_color", Color("#f3d28f"))
	if GameManager.font_mono:
		wallet.add_theme_font_override("font", GameManager.font_mono)
	_modal_body.add_child(wallet)

	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 8)
	_modal_body.add_child(tabs)

	for cat_pair in [["kurta", "Kurtas"], ["footwear", "Footwear"], ["headwear", "Headwear"], ["trail", "Bounce Trails"]]:
		var b := Button.new()
		b.text = cat_pair[1]
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.custom_minimum_size = Vector2(0, 36)
		var ck: String = cat_pair[0]
		GameManager.style_button(b, ck == _selected_wardrobe_cat)
		b.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			_selected_wardrobe_cat = ck
			_rebuild_modal_content()
		)
		tabs.add_child(b)

	var loadout: Dictionary = SaveManager.data.get("loadout", {})
	var items: Array = GameManager.cosmetics.get(_selected_wardrobe_cat, [])
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	_modal_body.add_child(grid)

	for item in items:
		var iid := str(item.get("id", ""))
		var owned := SaveManager.is_cosmetic_unlocked(iid)
		var equipped := str(loadout.get(_selected_wardrobe_cat, "")) == iid

		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		GameManager.style_panel(card, Color(0.08, 0.10, 0.15, 0.95), Color("#e59a3c") if equipped else Color(1, 1, 1, 0.15), 10)
		grid.add_child(card)

		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		card.add_child(row)

		var swatch := ColorRect.new()
		swatch.custom_minimum_size = Vector2(36, 36)
		swatch.color = Color.html(str(item.get("primaryColor", "#e59a3c")))
		row.add_child(swatch)

		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(info)

		var nm := Label.new()
		nm.text = str(item.get("name", iid))
		nm.add_theme_color_override("font_color", Color("#f8f5ee"))
		if GameManager.font_display_semibold:
			nm.add_theme_font_override("font", GameManager.font_display_semibold)
		info.add_child(nm)

		var desc := Label.new()
		desc.text = str(item.get("description", ""))
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		desc.add_theme_font_size_override("font_size", 12)
		desc.add_theme_color_override("font_color", Color("#94a3b8"))
		info.add_child(desc)

		var act := Button.new()
		act.custom_minimum_size = Vector2(124, 36)
		if equipped:
			act.text = "EQUIPPED"
			act.disabled = true
			GameManager.style_button(act, true)
		elif owned:
			act.text = "EQUIP"
			GameManager.style_button(act, false)
			act.pressed.connect(func() -> void:
				AudioManager.play_ui_click()
				SaveManager.equip_cosmetic(_selected_wardrobe_cat, iid)
			)
		else:
			var cost := int(item.get("costCoins", 0))
			var bp := int(item.get("requiresBlueprints", 0))
			act.text = "%d C%s" % [cost, (" · %d BP" % bp) if bp > 0 else ""]
			GameManager.style_button(act, false)
			act.pressed.connect(func() -> void:
				var res := SaveManager.unlock_cosmetic(item)
				if bool(res["ok"]):
					AudioManager.play_collectible(3, true)
				else:
					AudioManager.play_ui_click()
					wallet.text = "%s  (Current: %d Coins, %d Blueprints)" % [str(res["reason"]), int(SaveManager.data.get("coins", 0)), int(SaveManager.data.get("blueprintsCollected", 0))]
			)
		row.add_child(act)


func _build_challenges_modal() -> void:
	var comp: Array = SaveManager.data.get("completedChallenges", [])
	var prog: Dictionary = SaveManager.data.get("challengeProgress", {})
	for ch in GameManager.challenges:
		var cid := str(ch.get("id", ""))
		var done := comp.has(cid)
		var target := int(ch.get("targetCount", 1))
		var cur := target if done else mini(target, int(prog.get(cid, 0)))

		var card := PanelContainer.new()
		GameManager.style_panel(card, Color(0.08, 0.10, 0.14, 0.94), Color("#22c55e") if done else Color(1, 1, 1, 0.14), 8)
		_modal_body.add_child(card)

		var row := HBoxContainer.new()
		card.add_child(row)

		var left := VBoxContainer.new()
		left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(left)

		var t := Label.new()
		t.text = "%s  —  +%d Coins" % [str(ch.get("title", "")), int(ch.get("rewardCoins", 0))]
		t.add_theme_color_override("font_color", Color("#86efac") if done else Color("#f8f5ee"))
		left.add_child(t)

		var d := Label.new()
		d.text = str(ch.get("description", ""))
		d.add_theme_font_size_override("font_size", 12)
		d.add_theme_color_override("font_color", Color("#94a3b8"))
		left.add_child(d)

		var stat := Label.new()
		stat.text = "COMPLETED" if done else ("%d / %d" % [cur, target])
		stat.add_theme_color_override("font_color", Color("#22c55e") if done else Color("#e59a3c"))
		if GameManager.font_mono:
			stat.add_theme_font_override("font", GameManager.font_mono)
		row.add_child(stat)


func _build_achievements_modal() -> void:
	var unlocked: Array = SaveManager.data.get("unlockedAchievements", [])
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	_modal_body.add_child(grid)

	for a in GameManager.achievements:
		var aid := str(a.get("id", ""))
		var got := unlocked.has(aid)
		var card := PanelContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		GameManager.style_panel(card, Color(0.08, 0.10, 0.14, 0.94), Color("#e59a3c") if got else Color(1, 1, 1, 0.12), 8)
		grid.add_child(card)

		var vb := VBoxContainer.new()
		card.add_child(vb)

		var hdr := Label.new()
		hdr.text = "%s  (+%d Coins)  [%s]" % [str(a.get("name", "")), int(a.get("rewardCoins", 0)), "UNLOCKED" if got else "LOCKED"]
		hdr.add_theme_color_override("font_color", Color("#f5b832") if got else Color("#94a3b8"))
		vb.add_child(hdr)

		var desc := Label.new()
		desc.text = str(a.get("description", ""))
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		desc.add_theme_font_size_override("font_size", 12)
		desc.add_theme_color_override("font_color", Color("#cbd5e1"))
		vb.add_child(desc)


func _build_settings_modal() -> void:
	var s: Dictionary = SaveManager.settings

	_add_section_header("AUDIO & FAHH SIGNATURE SOUND")
	_add_slider_row("Master Volume", float(s.get("masterVolume", 0.75)), 0.0, 1.0, 0.05, func(v: float) -> void:
		SaveManager.update_settings({"masterVolume": v})
	)
	_add_slider_row("Music Volume", float(s.get("musicVolume", 0.50)), 0.0, 1.0, 0.05, func(v: float) -> void:
		SaveManager.update_settings({"musicVolume": v})
	)
	_add_slider_row("SFX Volume", float(s.get("sfxVolume", 0.85)), 0.0, 1.0, 0.05, func(v: float) -> void:
		SaveManager.update_settings({"sfxVolume": v})
	)

	var mute_cb := CheckButton.new()
	mute_cb.text = "Mute All Audio [M]"
	mute_cb.button_pressed = bool(s.get("muted", false))
	mute_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"muted": mute_cb.button_pressed})
	)
	_modal_body.add_child(mute_cb)

	var fahh_row := HBoxContainer.new()
	fahh_row.add_theme_constant_override("separation", 12)
	_modal_body.add_child(fahh_row)

	var fahh_cb := CheckButton.new()
	fahh_cb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	fahh_cb.text = "FAHH Comedic Impact Sound Effect"
	fahh_cb.button_pressed = bool(s.get("fahhEnabled", true))
	fahh_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"fahhEnabled": fahh_cb.button_pressed})
	)
	fahh_row.add_child(fahh_cb)

	var test_fahh := Button.new()
	test_fahh.text = "TEST FAHH"
	test_fahh.custom_minimum_size = Vector2(130, 36)
	GameManager.style_button(test_fahh, true)
	test_fahh.pressed.connect(func() -> void:
		AudioManager.preview_fahh()
	)
	fahh_row.add_child(test_fahh)

	_add_section_header("DISPLAY & GRAPHICS")
	var q_row := HBoxContainer.new()
	q_row.add_theme_constant_override("separation", 8)
	_modal_body.add_child(q_row)
	var qlbl := Label.new()
	qlbl.text = "Graphics Quality:"
	qlbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	q_row.add_child(qlbl)
	var cur_q := str(s.get("graphicsQuality", "high"))
	for qk in ["low", "medium", "high"]:
		var qb := Button.new()
		qb.text = qk.to_upper()
		qb.custom_minimum_size = Vector2(90, 34)
		GameManager.style_button(qb, cur_q == qk)
		var chosen: String = str(qk)
		qb.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			SaveManager.update_settings({"graphicsQuality": chosen})
		)
		q_row.add_child(qb)

	_add_slider_row("3D Resolution Scale", float(s.get("resolutionScale", 1.0)), 0.5, 1.0, 0.05, func(v: float) -> void:
		SaveManager.update_settings({"resolutionScale": v})
	)

	var sh_cb := CheckButton.new()
	sh_cb.text = "Dynamic Directional Shadows"
	sh_cb.button_pressed = bool(s.get("shadowsEnabled", true))
	sh_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"shadowsEnabled": sh_cb.button_pressed})
	)
	_modal_body.add_child(sh_cb)

	var vs_cb := CheckButton.new()
	vs_cb.text = "V-Sync"
	vs_cb.button_pressed = bool(s.get("vsync", true))
	vs_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"vsync": vs_cb.button_pressed})
	)
	_modal_body.add_child(vs_cb)

	var fs_cb := CheckButton.new()
	fs_cb.text = "Fullscreen Window"
	fs_cb.button_pressed = bool(s.get("fullscreen", false))
	fs_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"fullscreen": fs_cb.button_pressed})
	)
	_modal_body.add_child(fs_cb)

	_add_section_header("CAMERA & TOUCH CONTROLS")
	_add_slider_row("Camera Distance", float(s.get("cameraDistance", 8.5)), 5.5, 14.0, 0.5, func(v: float) -> void:
		SaveManager.update_settings({"cameraDistance": v})
	)
	_add_slider_row("Mouse Orbit Sensitivity", float(s.get("cameraSensitivity", 1.0)), 0.4, 2.2, 0.1, func(v: float) -> void:
		SaveManager.update_settings({"cameraSensitivity": v})
	)
	_add_slider_row("Camera Smoothing", float(s.get("cameraSmoothing", 1.0)), 0.4, 2.0, 0.1, func(v: float) -> void:
		SaveManager.update_settings({"cameraSmoothing": v})
	)

	var inv_cb := CheckButton.new()
	inv_cb.text = "Invert Camera Vertical Axis"
	inv_cb.button_pressed = bool(s.get("invertY", false))
	inv_cb.pressed.connect(func() -> void:
		SaveManager.update_settings({"invertY": inv_cb.button_pressed})
	)
	_modal_body.add_child(inv_cb)

	var tc_row := HBoxContainer.new()
	tc_row.add_theme_constant_override("separation", 8)
	_modal_body.add_child(tc_row)
	var tcl := Label.new()
	tcl.text = "On-Screen Touch Controls:"
	tcl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tc_row.add_child(tcl)
	var cur_tc := str(s.get("touchControlsMode", "auto"))
	for tcm in ["auto", "on", "off"]:
		var tb := Button.new()
		tb.text = tcm.to_upper()
		tb.custom_minimum_size = Vector2(84, 34)
		GameManager.style_button(tb, cur_tc == tcm)
		var mode: String = str(tcm)
		tb.pressed.connect(func() -> void:
			AudioManager.play_ui_click()
			SaveManager.update_settings({"touchControlsMode": mode})
		)
		tc_row.add_child(tb)

	_add_section_header("KEY BINDINGS")
	var bindings: Dictionary = s.get("bindings", {})
	var labels := {
		"move_forward": "Move Forward",
		"move_backward": "Move Backward",
		"move_left": "Move Left",
		"move_right": "Move Right",
		"jump": "Jump / Double Jump",
		"sprint": "Sprint",
		"slide": "Slide",
		"bounce": "Super Bounce",
		"dash": "Road Dash",
		"special": "Highway Surge",
		"interact": "Use Switch",
		"respawn": "Respawn Checkpoint",
		"pause": "Pause"
	}
	var kb_grid := GridContainer.new()
	kb_grid.columns = 2
	kb_grid.add_theme_constant_override("h_separation", 12)
	kb_grid.add_theme_constant_override("v_separation", 6)
	_modal_body.add_child(kb_grid)

	for act in ["move_forward", "move_backward", "move_left", "move_right", "jump", "sprint", "slide", "bounce", "dash", "special", "interact", "respawn", "pause"]:
		if not bindings.has(act):
			continue
		var r := HBoxContainer.new()
		r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		kb_grid.add_child(r)
		var al := Label.new()
		al.text = str(labels.get(act, act))
		al.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		r.add_child(al)
		var kb := Button.new()
		kb.custom_minimum_size = Vector2(130, 32)
		var key_code := int(bindings[act])
		kb.text = "PRESS KEY..." if _rebinding_action == act else OS.get_keycode_string(key_code as Key)
		GameManager.style_button(kb, _rebinding_action == act)
		var target_act: String = str(act)
		kb.pressed.connect(func() -> void:
			_rebinding_action = target_act
			_rebuild_modal_content()
		)
		r.add_child(kb)
		_rebind_buttons[act] = kb

	var foot := HBoxContainer.new()
	foot.add_theme_constant_override("separation", 10)
	_modal_body.add_child(foot)

	var reset_keys := Button.new()
	reset_keys.text = "RESET DEFAULT KEYS"
	GameManager.style_button(reset_keys, false)
	reset_keys.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		SaveManager.reset_bindings()
	)
	foot.add_child(reset_keys)

	var reset_prog := Button.new()
	reset_prog.text = "CONFIRM RESET SAVE?" if _confirm_reset else "RESET SAVE PROGRESS"
	GameManager.style_button(reset_prog, false, true)
	reset_prog.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		if not _confirm_reset:
			_confirm_reset = true
			reset_prog.text = "CONFIRM RESET SAVE?"
		else:
			_confirm_reset = false
			SaveManager.reset_progress()
			_rebuild_modal_content()
	)
	foot.add_child(reset_prog)


func _build_credits_modal() -> void:
	var txt := Label.new()
	txt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	txt.text = """BOUNCEBACK: THE GREAT ROAD ADVENTURE
Godot Engine 4.x Complete Edition

GAMEPLAY & CONTROLS
• Move: W A S D / Arrow Keys (Drag mouse to orbit camera, Wheel to zoom)
• Jump / Double Jump: Space
• Super Bounce: Q (Burst vertically & reset momentum)
• Road Dash: V (Burst horizontally across highway gaps)
• Slide: Ctrl / C (Duck under beams & speed down ramps)
• Sprint: Shift
• Highway Surge Special: F (Slow-motion world time + speed & jump boost)
• Activate Switch: E  |  Respawn at Checkpoint: R  |  Mute Audio: M

FEATURING
• 10 Handcrafted Worlds & 50 Playable 3D Stages from Indian City Worksites to Rohtang Tunnel & NH Finale
• Persistent user:// save system (Stars, Best Scores, Road Coins, Wardrobe, 20 Challenges, 10 Achievements)
• Preserved FAHH signature audio MP3 & procedural Raga Bhupali synthesized soundtrack
• Windows Desktop, Android Mobile Touch & Web HTML5 ready architecture"""
	txt.add_theme_color_override("font_color", Color("#e2e8f0"))
	_modal_body.add_child(txt)


func _add_section_header(title_text: String) -> void:
	var lbl := Label.new()
	lbl.text = title_text
	lbl.add_theme_color_override("font_color", Color("#e59a3c"))
	lbl.add_theme_font_size_override("font_size", 15)
	if GameManager.font_display_semibold:
		lbl.add_theme_font_override("font", GameManager.font_display_semibold)
	_modal_body.add_child(lbl)


func _add_slider_row(label_text: String, cur_val: float, min_v: float, max_v: float, step_v: float, on_change: Callable) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	_modal_body.add_child(row)

	var lbl := Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(220, 0)
	row.add_child(lbl)

	var slider := HSlider.new()
	slider.min_value = min_v
	slider.max_value = max_v
	slider.step = step_v
	slider.value = cur_val
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(slider)

	var val_lbl := Label.new()
	val_lbl.custom_minimum_size = Vector2(56, 0)
	val_lbl.text = "%.2f" % cur_val
	if GameManager.font_mono:
		val_lbl.add_theme_font_override("font", GameManager.font_mono)
	row.add_child(val_lbl)

	slider.value_changed.connect(func(v: float) -> void:
		val_lbl.text = "%.2f" % v
	)
	slider.drag_ended.connect(func(_changed: bool) -> void:
		on_change.call(slider.value)
	)
