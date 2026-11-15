extends Node3D
class_name SceneryBuilder

## Builds world-tailored 3D Indian highway environments: urban buildings, tower cranes,
## cable-stayed bridge pylons & rivers, Western Ghats ridges, tunnel arches, and monsoon rain.

var _rain_particles: CPUParticles3D = null


func build_scenery(level: Dictionary, theme: Dictionary) -> void:
	for c in get_children():
		c.queue_free()
	_rain_particles = null

	var style := str(theme.get("sceneryStyle", "city_site"))
	var rain := float(theme.get("rainIntensity", 0.0))

	# Estimate road span along Z for roadside prop distribution
	var z_min := -90.0
	var z_max := 20.0
	for p in level.get("platforms", []):
		var pz := float(p.get("position", {}).get("z", 0.0))
		var hz := float(p.get("size", {}).get("z", 4.0)) * 0.5
		z_min = minf(z_min, pz - hz)
		z_max = maxf(z_max, pz + hz)
	z_min -= 20.0
	z_max += 20.0

	var mat_bldg := _mat("#2b323d", 0.85, 0.1)
	var mat_win := _mat("#f2c879", 0.4, 0.0, "#f2c879", 0.65)
	var mat_crane := _mat("#e8a220", 0.45, 0.3)
	var mat_trunk := _mat("#5c4330", 0.9, 0.0)
	var mat_foliage := _mat("#3f7a47" if style != "mountain" else "#31633b", 0.88, 0.0)
	var mat_river := _mat("#1f5a7a", 0.12, 0.25)
	var mat_pylon := _mat("#c44536", 0.55, 0.25)
	var mat_mtn := _mat("#3d4f43", 0.95, 0.0)
	var mat_tunnel := _mat("#2d2a26", 0.85, 0.1)
	var mat_sodium := _mat("#ffb74d", 0.2, 0.0, "#ff9800", 1.8)
	var mat_pole := _mat("#424a54", 0.5, 0.65)

	# Roadside streetlamps along major outdoor corridors
	if style != "tunnel":
		var z := z_max - 6.0
		while z > z_min + 6.0:
			for side: float in [-1.0, 1.0]:
				var pole := _cyl(0.11, 5.8, mat_pole)
				pole.position = Vector3(side * 12.5, 2.5, z)
				var bulb := _box(Vector3(0.8, 0.18, 0.35), mat_sodium)
				bulb.position = Vector3(side * 11.9, 5.4, z)
				add_child(pole)
				add_child(bulb)
			z -= 26.0

	# Urban buildings & construction cranes (worlds 1, 5, 7, 9, 10)
	if style == "city_site" or style == "pothole" or style == "flyover" or style == "mega_site" or style == "ultimate":
		var z := z_max
		var idx := 0
		while z > z_min:
			for side: float in [-1.0, 1.0]:
				var h := 14.0 + float((idx * 7) % 22)
				var w := 6.5 + float((idx * 3) % 5)
				var bx: float = side * (18.5 + float((idx * 5) % 8))
				var bldg := _box(Vector3(w, h, w), mat_bldg)
				bldg.position = Vector3(bx, h * 0.5 - 12.0, z)
				add_child(bldg)
				var strip := _box(Vector3(w * 0.7, 0.45, w + 0.1), mat_win)
				strip.position = Vector3(bx, h * 0.72 - 12.0, z)
				add_child(strip)
				if idx % 3 == 0:
					_add_tree(Vector3(side * 13.5, -0.8, z - 6.0), mat_trunk, mat_foliage)
			if idx % 4 == 0:
				var cx := -17.0 if (idx % 8 == 0) else 17.0
				var mast := _box(Vector3(1.1, 26.0, 1.1), mat_crane)
				mast.position = Vector3(cx, 1.0, z)
				var boom := _box(Vector3(16.0, 0.9, 0.9), mat_crane)
				boom.position = Vector3(cx * 0.65, 13.5, z)
				add_child(mast)
				add_child(boom)
			z -= 22.0
			idx += 1

	# Bridge & river plane (World 3)
	if style == "bridge":
		var river := _box(Vector3(240.0, 0.4, (z_max - z_min) + 120.0), mat_river)
		river.position = Vector3(0.0, -14.0, (z_min + z_max) * 0.5)
		add_child(river)
		var pz := z_max - 15.0
		while pz > z_min + 15.0:
			for side in [-1.0, 1.0]:
				var pylon := _box(Vector3(1.5, 36.0, 2.2), mat_pylon)
				pylon.position = Vector3(side * 11.0, 4.0, pz)
				add_child(pylon)
			pz -= 48.0

	# Mountain ridges & pine trees (Worlds 4, 8)
	if style == "mountain" or style == "monsoon":
		var mz := z_max
		var mi := 0
		while mz > z_min:
			for side: float in [-1.0, 1.0]:
				var cone := CylinderMesh.new()
				cone.top_radius = 1.2
				cone.bottom_radius = 14.0 + float((mi * 3) % 7)
				cone.height = 24.0 + float((mi * 5) % 16)
				var m_mesh := MeshInstance3D.new()
				m_mesh.mesh = cone
				m_mesh.material_override = mat_mtn
				m_mesh.position = Vector3(side * (28.0 + float((mi * 4) % 9)), -6.0, mz)
				add_child(m_mesh)
				_add_tree(Vector3(side * 13.0, -0.6, mz - 4.0), mat_trunk, mat_foliage)
			mz -= 26.0
			mi += 1

	# Highway roadside trees & toll signboards (World 2)
	if style == "highway":
		var hz := z_max
		while hz > z_min:
			for side: float in [-1.0, 1.0]:
				_add_tree(Vector3(side * 14.0, -0.6, hz), mat_trunk, mat_foliage)
			hz -= 20.0

	# Rohtang Tunnel Arch Ribs & Sodium Lights (World 6)
	if style == "tunnel":
		var tz := z_max
		while tz > z_min:
			var wall_l := _box(Vector3(1.6, 12.0, 12.0), mat_tunnel)
			wall_l.position = Vector3(-12.5, 4.0, tz)
			var wall_r := _box(Vector3(1.6, 12.0, 12.0), mat_tunnel)
			wall_r.position = Vector3(12.5, 4.0, tz)
			var ceil := _box(Vector3(26.0, 1.4, 12.0), mat_tunnel)
			ceil.position = Vector3(0.0, 10.2, tz)
			var s_light := _box(Vector3(1.6, 0.2, 0.5), mat_sodium)
			s_light.position = Vector3(0.0, 9.3, tz)
			add_child(wall_l)
			add_child(wall_r)
			add_child(ceil)
			add_child(s_light)
			tz -= 12.0

	# Monsoon rain particles (World 8 & light rain World 4)
	if rain > 0.05:
		_rain_particles = CPUParticles3D.new()
		_rain_particles.amount = int(120 + rain * 220)
		_rain_particles.lifetime = 0.9
		_rain_particles.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
		_rain_particles.emission_box_extents = Vector3(24.0, 2.0, 24.0)
		_rain_particles.direction = Vector3(0.0, -1.0, 0.0)
		_rain_particles.spread = 4.0
		_rain_particles.initial_velocity_min = 24.0
		_rain_particles.initial_velocity_max = 32.0
		var rm := BoxMesh.new()
		rm.size = Vector3(0.04, 0.85, 0.04)
		var rmat := StandardMaterial3D.new()
		rmat.albedo_color = Color(0.75, 0.90, 1.0, 0.55)
		rmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		rm.material = rmat
		_rain_particles.mesh = rm
		add_child(_rain_particles)


func update_scenery(player_pos: Vector3) -> void:
	if _rain_particles != null:
		_rain_particles.position = player_pos + Vector3(0.0, 14.0, -6.0)


func _add_tree(pos: Vector3, m_trunk: Material, m_leaf: Material) -> void:
	var tr := _cyl(0.24, 2.4, m_trunk)
	tr.position = pos + Vector3(0.0, 1.2, 0.0)
	var sph := SphereMesh.new()
	sph.radius = 1.55
	sph.height = 2.8
	var crown := MeshInstance3D.new()
	crown.mesh = sph
	crown.material_override = m_leaf
	crown.position = pos + Vector3(0.0, 3.0, 0.0)
	add_child(tr)
	add_child(crown)


func _box(sz: Vector3, mat: Material) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = sz
	var m := MeshInstance3D.new()
	m.mesh = b
	m.material_override = mat
	m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return m


func _cyl(r: float, h: float, mat: Material) -> MeshInstance3D:
	var c := CylinderMesh.new()
	c.top_radius = r * 0.8
	c.bottom_radius = r
	c.height = h
	var m := MeshInstance3D.new()
	m.mesh = c
	m.material_override = mat
	m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return m


func _mat(hex: String, rough := 0.8, metal := 0.05, em_hex := "", em_e := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color.html(hex)
	m.roughness = rough
	m.metallic = metal
	if em_hex != "":
		m.emission_enabled = true
		m.emission = Color.html(em_hex)
		m.emission_energy_multiplier = em_e
	return m
