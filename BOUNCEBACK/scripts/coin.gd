extends Node3D
class_name CollectibleSystem

## Collectible 3D items: Road Coins, Golden Helmets, Blueprints, Energy Cells, and Secret Highway Signs.

var items: Array[Dictionary] = []
var collected_ids: Array[String] = []


func build_collectibles(level: Dictionary) -> void:
	for c in get_children():
		c.queue_free()
	items.clear()
	collected_ids.clear()

	var m_coin := _mat("#f5b832", 0.22, 0.85, "#a86b14", 0.38)
	var m_bp := _mat("#38bdf8", 0.35, 0.1, "#0284c7", 0.45)
	var m_energy := _mat("#4ade80", 0.25, 0.1, "#16a34a", 0.55)
	var m_sign := _mat("#16803c", 0.45, 0.1, "#0f5c2b", 0.35)
	var m_steel := _mat("#3b414a", 0.45, 0.7)

	for col_v in level.get("collectibles", []):
		if typeof(col_v) != TYPE_DICTIONARY:
			continue
		var def: Dictionary = col_v
		var pos := _v3(def.get("position", {}))
		var kind := str(def.get("kind", "coin"))

		var grp := Node3D.new()
		grp.position = pos
		add_child(grp)

		if kind == "helmet":
			var dome := SphereMesh.new()
			dome.radius = 0.38
			dome.height = 0.44
			dome.is_hemisphere = true
			var d_mi := MeshInstance3D.new()
			d_mi.mesh = dome
			d_mi.material_override = m_coin
			grp.add_child(d_mi)
		elif kind == "blueprint":
			var sc := CylinderMesh.new()
			sc.top_radius = 0.14
			sc.bottom_radius = 0.14
			sc.height = 0.78
			var s_mi := MeshInstance3D.new()
			s_mi.mesh = sc
			s_mi.material_override = m_bp
			s_mi.rotation.z = 0.65
			grp.add_child(s_mi)
		elif kind == "energy":
			var pm := PrismMesh.new()
			pm.size = Vector3(0.55, 0.72, 0.55)
			var e_mi := MeshInstance3D.new()
			e_mi.mesh = pm
			e_mi.material_override = m_energy
			grp.add_child(e_mi)
		elif kind == "sign":
			var plate := BoxMesh.new()
			plate.size = Vector3(0.68, 0.54, 0.1)
			var pl_mi := MeshInstance3D.new()
			pl_mi.mesh = plate
			pl_mi.material_override = m_sign
			var post := CylinderMesh.new()
			post.top_radius = 0.05
			post.bottom_radius = 0.05
			post.height = 0.8
			var po_mi := MeshInstance3D.new()
			po_mi.mesh = post
			po_mi.material_override = m_steel
			po_mi.position = Vector3(0.0, -0.5, 0.0)
			grp.add_child(pl_mi)
			grp.add_child(po_mi)
		else:
			var disc := CylinderMesh.new()
			disc.top_radius = 0.42
			disc.bottom_radius = 0.42
			disc.height = 0.11
			disc.radial_segments = 18
			var c_mi := MeshInstance3D.new()
			c_mi.mesh = disc
			c_mi.material_override = m_coin
			c_mi.rotation.x = PI * 0.5
			grp.add_child(c_mi)

		items.append({
			"def": def,
			"group": grp,
			"basePos": pos,
			"kind": kind,
			"collected": false
		})


func reset_collectibles() -> void:
	collected_ids.clear()
	for it in items:
		it["collected"] = false
		var grp: Node3D = it["group"]
		grp.visible = true
		grp.position = it["basePos"]


func update_animations(real_time: float) -> void:
	for it in items:
		var grp: Node3D = it["group"]
		if bool(it["collected"]):
			grp.visible = false
			continue
		var bp: Vector3 = it["basePos"]
		grp.rotation.y = real_time * 2.2
		grp.position.y = bp.y + sin(real_time * 3.0 + bp.z) * 0.16


func check_pickups(player_pos: Vector3) -> Variant:
	for it in items:
		if bool(it["collected"]):
			continue
		var bp: Vector3 = it["basePos"]
		if player_pos.distance_to(bp) < 1.35:
			it["collected"] = true
			(it["group"] as Node3D).visible = false
			collected_ids.append(str(it["def"].get("id", "")))
			return it
	return null


func _mat(hex: String, rough: float, metal: float, em_hex := "", em_e := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color.html(hex)
	m.roughness = rough
	m.metallic = metal
	if em_hex != "":
		m.emission_enabled = true
		m.emission = Color.html(em_hex)
		m.emission_energy_multiplier = em_e
	return m


func _v3(d: Variant) -> Vector3:
	if typeof(d) != TYPE_DICTIONARY:
		return Vector3.ZERO
	return Vector3(float(d.get("x", 0.0)), float(d.get("y", 0.0)), float(d.get("z", 0.0)))
