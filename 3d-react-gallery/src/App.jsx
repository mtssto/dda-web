import React, { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Shared ref for camera speed (used by vignette overlay)
const speedRef = { current: 0 }

// LSD dream state — shared between components
const dreamState = {
    hueShift: 0,         // triggered on image touch
    flashIntensity: 0,   // white flash on image open
    distort: 0,          // screen distortion amount
    breathe: 0,          // global breathe timer
}

// Click target — where camera should fly to
const flyTarget = { current: null }

// Set true when pointer goes down on a 3D mesh — suppresses fly-to
const pointerOnMesh = { current: false }

// Hand tracking — palm position drives camera look, pinch = click
const handInput = {
    active: false,
    yawDelta: 0,
    pitchDelta: 0,
    gesture: 'none',   // 'point' | 'fly' | 'open' | 'none'
    flying: false,
    pointJustFired: false,
}

// Callback set by App so pinch can open images
const pinchClickCallback = { current: null }

// Touch joystick state — shared so visual can read it
const joystickState = { active: false, baseX: 0, baseY: 0, dx: 0, dy: 0 }

function ImageNode({ url, position, onImageClick }) {
    const { camera } = useThree()
    const groupRef = useRef()
    const meshRef = useRef()
    const glowRef = useRef()
    const [texture, setTexture] = useState(null)
    const [hovered, setHovered] = useState(false)
    const hoverUV = useRef({ x: 0.5, y: 0.5 })
    const opacity = useRef(0)

    useEffect(() => {
        const loader = new THREE.TextureLoader()
        loader.load(
            url,
            (t) => { t.colorSpace = THREE.SRGBColorSpace; setTexture(t) },
            undefined,
            () => console.error('Skipping broken image:', url)
        )
    }, [url])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.elapsedTime

        // Billboard — lazily face camera
        groupRef.current.quaternion.slerp(
            (() => {
                const dummy = new THREE.Object3D()
                dummy.position.copy(groupRef.current.position)
                dummy.lookAt(camera.position)
                return dummy.quaternion
            })(),
            0.03
        )

        // Fade in based on distance
        if (meshRef.current?.material) {
            const dist = camera.position.distanceTo(groupRef.current.position)
            const targetOpacity = dist < 1800 ? THREE.MathUtils.clamp((1800 - dist) / 1000, 0, 1) : 0
            opacity.current = THREE.MathUtils.lerp(opacity.current, targetOpacity, 0.04)
            meshRef.current.material.opacity = opacity.current
            if (glowRef.current) glowRef.current.material.opacity = opacity.current * 0.06

            // LSD: very close = trigger hue shift + glow burst
            if (dist < 200 && opacity.current > 0.3) {
                dreamState.hueShift = (dreamState.hueShift + 0.008) % 1
                dreamState.distort = Math.min(dreamState.distort + 0.02, 1)
                if (glowRef.current) {
                    glowRef.current.material.opacity = THREE.MathUtils.lerp(
                        glowRef.current.material.opacity, 0.45, 0.08
                    )
                }
            } else {
                dreamState.distort = THREE.MathUtils.lerp(dreamState.distort, 0, 0.02)
            }
        }

        if (!meshRef.current) return

        // Breathe — slow scale pulse
        const breatheScale = 1 + Math.sin(t * 0.6 + position[0] * 0.01) * 0.025
        const hoverTarget = hovered ? 1.04 : 1
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, hoverTarget * breatheScale, 0.05))

        if (hovered) {
            const lx = (hoverUV.current.x - 0.5) * 5
            const ly = (hoverUV.current.y - 0.5) * 3
            meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, lx, 0.05)
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -ly, 0.05)
            meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 6, 0.05)
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, (hoverUV.current.x - 0.5) * 0.08, 0.05)
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -(hoverUV.current.y - 0.5) * 0.06, 0.05)
        } else {
            meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.05)
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.05)
            meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, 0.05)
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.05)
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.05)
        }
    })

    if (!texture) return null
    const aspect = texture.image.width / texture.image.height
    const W = 90 * aspect
    const H = 90

    return (
        <group ref={groupRef} position={position}>
            <mesh ref={glowRef} position={[0, 0, -1]}>
                <planeGeometry args={[W * 1.2, H * 1.2]} />
                <meshBasicMaterial color="#fff3d1" transparent opacity={0}
                    blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh
                ref={meshRef}
                userData={{ imageUrl: url }}
                onPointerDown={(e) => { e.stopPropagation(); pointerOnMesh.current = true }}
                onClick={(e) => {
                    e.stopPropagation();
                    flyTarget.current = null;
                    dreamState.flashIntensity = 1
                    dreamState.hueShift = (dreamState.hueShift + 0.15 + Math.random() * 0.2) % 1
                    if (onImageClick) onImageClick(url);
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onPointerMove={(e) => { if (e.uv) { hoverUV.current.x = e.uv.x; hoverUV.current.y = e.uv.y } }}
            >
                <planeGeometry args={[W, H]} />
                <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0} />
            </mesh>
        </group>
    )
}

function FloatingText({ text, position, scale = 1 }) {
    const textRef = useRef()
    const { camera } = useThree()
    const opacity = useRef(0)

    useFrame(() => {
        if (!textRef.current) return
        textRef.current.lookAt(camera.position)
        const dist = textRef.current
            ? camera.position.distanceTo(textRef.current.position)
            : 9999
        const target = dist < 1800 ? THREE.MathUtils.clamp((1800 - dist) / 1200, 0, 1) : 0
        opacity.current = THREE.MathUtils.lerp(opacity.current, target, 0.04)
        textRef.current.fillOpacity = opacity.current
    })

    return (
        <Text ref={textRef} position={position} scale={scale * 22}
            color="#fffcf0" fontStyle="italic" letterSpacing={0.05} fillOpacity={0}>
            {text}
        </Text>
    )
}

function CameraController() {
    const { camera, gl } = useThree()

    const yaw = useRef(0)
    const pitch = useRef(0)
    const yawVel = useRef(0)
    const pitchVel = useRef(0)
    const velocity = useRef(new THREE.Vector3())
    const autoDrift = useRef(0)
    const keys = useRef({})

    const dragging = useRef(false)
    const dragMoved = useRef(false)
    const lastPointer = useRef({ x: 0, y: 0 })
    const pointerDown = useRef({ x: 0, y: 0 })

    // Two-finger touch: left = joystick move, right = look
    const joystick = useRef({ active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 })
    const lookTouch = useRef({ active: false, id: null, lastX: 0, lastY: 0 })

    const FRICTION = 0.88
    const ROT_FRICTION = 0.90

    useEffect(() => {
        const canvas = gl.domElement
        const raycaster = new THREE.Raycaster()

        const onPointerDown = (clientX, clientY) => {
            dragging.current = true
            dragMoved.current = false
            lastPointer.current = { x: clientX, y: clientY }
            pointerDown.current = { x: clientX, y: clientY }
        }

        const onPointerMove = (clientX, clientY) => {
            if (!dragging.current) return
            const dx = clientX - lastPointer.current.x
            const dy = clientY - lastPointer.current.y
            const totalDx = clientX - pointerDown.current.x
            const totalDy = clientY - pointerDown.current.y
            if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > 4) {
                dragMoved.current = true
                flyTarget.current = null
            }
            lastPointer.current = { x: clientX, y: clientY }
            // Clamp per-frame delta to avoid shake from fast moves
            const sensitivity = 0.0007
            yawVel.current = Math.max(-0.03, Math.min(0.03, yawVel.current - dx * sensitivity))
            pitchVel.current = Math.max(-0.02, Math.min(0.02, pitchVel.current - dy * sensitivity))
        }

        const onPointerUp = (clientX, clientY) => {
            dragging.current = false
            const wasOnMesh = pointerOnMesh.current
            pointerOnMesh.current = false
            if (!dragMoved.current && !wasOnMesh) {
                const rect = canvas.getBoundingClientRect()
                const nx = ((clientX - rect.left) / rect.width) * 2 - 1
                const ny = -((clientY - rect.top) / rect.height) * 2 + 1
                raycaster.setFromCamera({ x: nx, y: ny }, camera)
                const target = camera.position.clone()
                    .add(raycaster.ray.direction.clone().multiplyScalar(600))
                flyTarget.current = target
            }
        }

        const onMouseDown = (e) => onPointerDown(e.clientX, e.clientY)
        const onMouseMove = (e) => onPointerMove(e.clientX, e.clientY)
        const onMouseUp = (e) => onPointerUp(e.clientX, e.clientY)

        // Multi-touch: left half = joystick, right half = look
        const onTouchStart = (e) => {
            e.preventDefault()
            Array.from(e.changedTouches).forEach(t => {
                const isLeft = t.clientX < window.innerWidth / 2
                if (isLeft && !joystick.current.active) {
                    joystick.current = { active: true, id: t.identifier, baseX: t.clientX, baseY: t.clientY, dx: 0, dy: 0 }
                    Object.assign(joystickState, { active: true, baseX: t.clientX, baseY: t.clientY, dx: 0, dy: 0 })
                } else if (!isLeft && !lookTouch.current.active) {
                    lookTouch.current = { active: true, id: t.identifier, lastX: t.clientX, lastY: t.clientY }
                    onPointerDown(t.clientX, t.clientY)
                }
            })
        }
        const onTouchMove = (e) => {
            e.preventDefault()
            Array.from(e.changedTouches).forEach(t => {
                if (joystick.current.active && t.identifier === joystick.current.id) {
                    joystick.current.dx = t.clientX - joystick.current.baseX
                    joystick.current.dy = t.clientY - joystick.current.baseY
                    joystickState.dx = joystick.current.dx
                    joystickState.dy = joystick.current.dy
                }
                if (lookTouch.current.active && t.identifier === lookTouch.current.id) {
                    const dx = t.clientX - lookTouch.current.lastX
                    const dy = t.clientY - lookTouch.current.lastY
                    lookTouch.current.lastX = t.clientX
                    lookTouch.current.lastY = t.clientY
                    yawVel.current = Math.max(-0.03, Math.min(0.03, yawVel.current - dx * 0.0007))
                    pitchVel.current = Math.max(-0.02, Math.min(0.02, pitchVel.current - dy * 0.0007))
                    onPointerMove(t.clientX, t.clientY)
                }
            })
        }
        const onTouchEnd = (e) => {
            e.preventDefault()
            Array.from(e.changedTouches).forEach(t => {
                if (joystick.current.active && t.identifier === joystick.current.id) {
                    joystick.current = { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 }
                    Object.assign(joystickState, { active: false, dx: 0, dy: 0 })
                }
                if (lookTouch.current.active && t.identifier === lookTouch.current.id) {
                    lookTouch.current = { active: false, id: null, lastX: 0, lastY: 0 }
                    onPointerUp(t.clientX, t.clientY)
                }
            })
        }

        const onKeyDown = (e) => {
            flyTarget.current = null
            // Prevent arrow keys from scrolling the page
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault()
            }
            keys.current[e.code] = true
        }
        const onKeyUp = (e) => { keys.current[e.code] = false }

        // Immediately blur canvas after click so it never traps keyboard focus
        const onCanvasClick = () => { canvas.blur(); window.focus() }

        canvas.addEventListener('mousedown', onMouseDown)
        canvas.addEventListener('click', onCanvasClick)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        canvas.addEventListener('touchstart', onTouchStart, { passive: false })
        canvas.addEventListener('touchmove', onTouchMove, { passive: false })
        canvas.addEventListener('touchend', onTouchEnd)
        document.addEventListener('keydown', onKeyDown, true)
        document.addEventListener('keyup', onKeyUp, true)

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown)
            canvas.removeEventListener('click', onCanvasClick)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            canvas.removeEventListener('touchstart', onTouchStart)
            canvas.removeEventListener('touchmove', onTouchMove)
            canvas.removeEventListener('touchend', onTouchEnd)
            document.removeEventListener('keydown', onKeyDown, true)
            document.removeEventListener('keyup', onKeyUp, true)
        }
    }, [gl, camera])

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05)
        autoDrift.current += dt

        // Rotation inertia
        yaw.current += yawVel.current
        pitch.current += pitchVel.current

        // Hand tracking — palm steers camera, pinch flies/clicks
        if (handInput.active) {
            const deadzone = 0.0008
            const fy = Math.abs(handInput.yawDelta) > deadzone ? handInput.yawDelta * 0.4 : 0
            const fp = Math.abs(handInput.pitchDelta) > deadzone ? handInput.pitchDelta * 0.4 : 0
            yaw.current += Math.max(-0.012, Math.min(0.012, fy))
            pitch.current += Math.max(-0.009, Math.min(0.009, fp))

            // GESTURE: open hand = stop all movement
            if (handInput.gesture === 'open') {
                velocity.current.set(0, 0, 0)
                flyTarget.current = null
            }

            // GESTURE: 4 fingers touch thumb = fly forward
            if (handInput.flying) {
                const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(qY)
                velocity.current.lerp(dir.multiplyScalar(18), 0.06)
            }

            // GESTURE: index point (on trigger) = open image under crosshair
            if (handInput.pointJustFired) {
                handInput.pointJustFired = false
                const ray = new THREE.Raycaster()
                ray.setFromCamera({ x: 0, y: 0 }, camera)
                const meshes = []
                camera.parent?.traverse(obj => { if (obj.isMesh && obj.material?.map) meshes.push(obj) })
                const hits = ray.intersectObjects(meshes, false)
                if (hits.length > 0 && hits[0].object.userData?.imageUrl && pinchClickCallback.current) {
                    pinchClickCallback.current(hits[0].object.userData.imageUrl)
                }
            }
        }
        pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current))
        yawVel.current = Math.max(-0.03, Math.min(0.03, yawVel.current * ROT_FRICTION))
        pitchVel.current = Math.max(-0.02, Math.min(0.02, pitchVel.current * ROT_FRICTION))

        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch.current)
        camera.quaternion.copy(qYaw).multiply(qPitch)

        // Click-to-fly
        if (flyTarget.current) {
            const toTarget = flyTarget.current.clone().sub(camera.position)
            const dist = toTarget.length()
            if (dist > 8) {
                // Increased max speed from 8 to 45, and distance multiplier for faster approach
                velocity.current.lerp(toTarget.normalize().multiplyScalar(Math.min(dist * 0.03, 20)), 0.05)
            } else {
                flyTarget.current = null
                velocity.current.multiplyScalar(0.3)
            }
        } else {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(qYaw)
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(qYaw)
            const up = new THREE.Vector3(0, 1, 0)
            const move = new THREE.Vector3()

            if (keys.current['ArrowUp']) move.add(forward)
            if (keys.current['ArrowDown']) move.sub(forward)
            if (keys.current['ArrowLeft']) move.sub(right)
            if (keys.current['ArrowRight']) move.add(right)
            if (keys.current['Space']) move.add(up)
            if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) move.sub(up)

            // Touch joystick (left thumb)
            if (joystick.current.active) {
                const jx = joystick.current.dx / 60
                const jy = joystick.current.dy / 60
                const jLen = Math.min(Math.sqrt(jx * jx + jy * jy), 1)
                if (jLen > 0.1) {
                    move.add(forward.clone().multiplyScalar(-jy * jLen))
                    move.add(right.clone().multiplyScalar(jx * jLen))
                }
            }

            if (move.length() > 0) {
                move.normalize()
                // Increased arrow key acceleration
                velocity.current.add(move.multiplyScalar(8.0 * dt * 60))
            } else {
                // Auto-drift when idle
                const driftFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(qYaw)
                const driftRight = new THREE.Vector3(1, 0, 0).applyQuaternion(qYaw)
                const driftUp = new THREE.Vector3(0, 1, 0)
                const autoMove = new THREE.Vector3()
                autoMove.add(driftFwd.multiplyScalar(0.2))
                autoMove.add(driftRight.multiplyScalar(Math.sin(autoDrift.current * 0.18) * 0.06))
                autoMove.add(driftUp.multiplyScalar(Math.sin(autoDrift.current * 0.11) * 0.03))
                velocity.current.lerp(autoMove, 0.015)
            }
        }

        velocity.current.multiplyScalar(FRICTION)
        camera.position.add(velocity.current)

        speedRef.current = velocity.current.length()

        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2200, 2200)
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, -1500, 1500)
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6200, 200)
    })

    return null
}

// All background images — add as many as you want here
const BG_IMAGES = [
    '../portfolio/sections/obras/sin-titulo-4-marcadores-sobre-papel.png',
    // Add more paths here, e.g.:
    // '../portfolio/sections/obras/otra-obra.png',
    // '../portfolio/sections/obras/tercera-obra.png',
]

function DynamicBackground() {
    const { scene } = useThree()
    const mesh1Ref = useRef()  // current bg
    const mesh2Ref = useRef()  // next bg (for crossfade)
    const dreamHue = useRef(0)
    const textures = useRef([])
    const currentIdx = useRef(0)
    const fadeAlpha = useRef(1)
    const fadingIn = useRef(false)
    const timer = useRef(0)
    const CYCLE_TIME = 18  // seconds between bg switches

    useEffect(() => {
        const loader = new THREE.TextureLoader()

        // Load all textures
        BG_IMAGES.forEach((path, i) => {
            loader.load(path, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.anisotropy = 16  // maximum sharpness
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                textures.current[i] = tex
                // Set first texture immediately
                if (i === 0 && mesh1Ref.current) {
                    mesh1Ref.current.material.map = tex
                    mesh1Ref.current.material.needsUpdate = true
                }
            })
        })

        scene.background = null
        scene.fog = new THREE.Fog('#f5efe0', 800, 6000)
        return () => { scene.fog = null }
    }, [scene])

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime
        if (!mesh1Ref.current || !mesh2Ref.current) return

        // Dream hue tint
        dreamHue.current = THREE.MathUtils.lerp(dreamHue.current, dreamState.hueShift, 0.02)
        const tintH = (0.08 + dreamHue.current * 0.3) % 1
        const tintS = 0.08 + dreamState.distort * 0.3
        mesh1Ref.current.material.color.setHSL(tintH, tintS, 1.0)
        mesh2Ref.current.material.color.setHSL(tintH, tintS, 1.0)

        // Slow Y drift for spatial parallax — feels like moving through space
        const slowDrift = t * 0.002
        mesh1Ref.current.rotation.y = slowDrift
        mesh2Ref.current.rotation.y = slowDrift
        // Gentle vertical bob on the sphere
        mesh1Ref.current.rotation.x = Math.sin(t * 0.05) * 0.08
        mesh2Ref.current.rotation.x = Math.sin(t * 0.05) * 0.08

        // Fog: breathes with speed and dream state for depth
        if (scene.fog) {
            const baseFar = 6000
            const speedPush = speedRef.current * 80   // faster = fog pushes back
            const dreamPull = dreamState.distort * -1500
            scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, baseFar + speedPush + dreamPull, 0.03)
            scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 800 + dreamState.distort * -400, 0.03)
            scene.fog.color.setHSL(tintH, 0.06, 0.97)
        }

        // Cycle backgrounds if more than 1
        if (BG_IMAGES.length <= 1) return

        timer.current += delta
        if (!fadingIn.current && timer.current > CYCLE_TIME) {
            // Start crossfade to next image
            const nextIdx = (currentIdx.current + 1) % textures.current.length
            const nextTex = textures.current[nextIdx]
            if (nextTex) {
                mesh2Ref.current.material.map = nextTex
                mesh2Ref.current.material.needsUpdate = true
                mesh2Ref.current.material.opacity = 0
                fadingIn.current = true
                timer.current = 0
            }
        }

        if (fadingIn.current) {
            const newAlpha = Math.min(1, mesh2Ref.current.material.opacity + delta * 0.3)
            mesh2Ref.current.material.opacity = newAlpha
            mesh1Ref.current.material.opacity = 1 - newAlpha

            if (newAlpha >= 1) {
                // Swap: mesh2 becomes current
                const tmp = mesh1Ref.current.material.map
                mesh1Ref.current.material.map = mesh2Ref.current.material.map
                mesh1Ref.current.material.opacity = 1
                mesh2Ref.current.material.opacity = 0
                mesh2Ref.current.material.map = tmp
                mesh1Ref.current.material.needsUpdate = true
                mesh2Ref.current.material.needsUpdate = true
                currentIdx.current = (currentIdx.current + 1) % textures.current.length
                fadingIn.current = false
            }
        }
    })

    return (
        <>
            {/* High quality sphere — 128 segments for sharp curved image */}
            <mesh ref={mesh1Ref} scale={[-1, 1, 1]}>
                <sphereGeometry args={[9000, 128, 64]} />
                <meshBasicMaterial side={THREE.BackSide} color="#ffffff" transparent opacity={1} />
            </mesh>
            <mesh ref={mesh2Ref} scale={[-1, 1, 1]}>
                <sphereGeometry args={[8990, 128, 64]} />
                <meshBasicMaterial side={THREE.BackSide} color="#ffffff" transparent opacity={0} />
            </mesh>
        </>
    )
}

function Scene({ items, onImageClick }) {
    return (
        <>
            <CameraController />
            {items.map((item, i) => {
                if (item.type === 'image') return (
                    <ImageNode key={i} url={item.url} position={item.position} onImageClick={onImageClick} />
                )
                if (item.type === 'text') return <FloatingText key={i} text={item.text} position={item.position} scale={item.scale} />
                return null
            })}
        </>
    )
}

function generatePositions(images, phrases) {
    const combined = []
    const INNER = 200
    const OUTER = 2200
    const DEPTH = 5000

    images.forEach((img, i) => {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        const theta = goldenAngle * i
        const phi = Math.acos(1 - 2 * (i / images.length))
        const r = INNER + Math.random() * (OUTER - INNER)
        combined.push({
            type: 'image',
            url: img.startsWith('http') ? img : `../${encodeURI(img)}`,
            position: [
                Math.sin(phi) * Math.cos(theta) * r,
                Math.cos(phi) * r * 0.5,
                -(INNER + Math.sin(phi) * Math.sin(theta) * r * 0.5 + Math.random() * DEPTH)
            ],
        })
    })

    phrases.forEach((p, i) => {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        const theta = goldenAngle * i * 7
        const r = 300 + Math.random() * 800
        combined.push({
            type: 'text',
            text: p,
            scale: 0.9 + Math.random() * 1.1,
            position: [
                Math.cos(theta) * r,
                (Math.random() - 0.5) * 600,
                -(400 + Math.random() * DEPTH * 0.8),
            ],
        })
    })

    return combined
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve()
        const s = document.createElement('script')
        s.src = src; s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
    })
}

// Professor X — head movement steers the camera
function HandTracker() {
    const videoRef = useRef()
    const canvasRef = useRef()
    const [active, setActive] = useState(false)
    const [status, setStatus] = useState('idle')
    const [label, setLabel] = useState('')
    const smoothX = useRef(0)
    const smoothY = useRef(0)
    const neutralX = useRef(null)
    const neutralY = useRef(null)
    const wasPointing = useRef(false)
    const prevPalmPos = useRef(null)
    const pinchMoveDist = useRef(0)
    const rafRef = useRef()

    const start = async () => {
        setStatus('loading')
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')

            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
            videoRef.current.srcObject = stream
            await videoRef.current.play()

            const hands = new window.Hands({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
            })
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.65,
                minTrackingConfidence: 0.55,
            })

            hands.onResults((results) => {
                const ctx = canvasRef.current?.getContext('2d')
                if (!ctx) return
                ctx.clearRect(0, 0, 160, 120)
                ctx.save()
                ctx.scale(-1, 1)
                ctx.drawImage(videoRef.current, -160, 0, 160, 120)
                ctx.restore()

                if (!results.multiHandLandmarks?.length) {
                    handInput.active = false
                    setLabel('MOSTRÁ TU MANO')
                    return
                }

                const lm = results.multiHandLandmarks[0]

                // Palm center = average of wrist (0) + knuckles (5,9,13,17)
                const palmX = [0, 5, 9, 13, 17].reduce((s, i) => s + lm[i].x, 0) / 5
                const palmY = [0, 5, 9, 13, 17].reduce((s, i) => s + lm[i].y, 0) / 5

                // Set neutral on first frame
                if (neutralX.current === null) {
                    neutralX.current = palmX
                    neutralY.current = palmY
                }

                // Offset from neutral, smoothed
                const offsetX = palmX - neutralX.current
                const offsetY = palmY - neutralY.current
                smoothX.current += (offsetX - smoothX.current) * 0.12
                smoothY.current += (offsetY - smoothY.current) * 0.12

                handInput.yawDelta = smoothX.current * -0.05
                handInput.pitchDelta = smoothY.current * -0.04
                handInput.active = true

                // --- Gesture detection ---

                // Finger tip and base landmarks
                const thumbTip = lm[4], thumbBase = lm[2]
                const indexTip = lm[8], indexBase = lm[5]
                const middleTip = lm[12], middleBase = lm[9]
                const ringTip = lm[16], ringBase = lm[13]
                const pinkyTip = lm[20], pinkyBase = lm[17]

                // A finger is "extended" if its tip is farther from wrist than its base
                const wrist = lm[0]
                const extended = (tip, base) =>
                    Math.hypot(tip.x - wrist.x, tip.y - wrist.y) >
                    Math.hypot(base.x - wrist.x, base.y - wrist.y) * 1.1

                const indexUp = extended(indexTip, indexBase)
                const middleUp = extended(middleTip, middleBase)
                const ringUp = extended(ringTip, ringBase)
                const pinkyUp = extended(pinkyTip, pinkyBase)

                // Finger touching thumb = tip close to thumb tip
                const nearThumb = (tip) => Math.hypot(tip.x - thumbTip.x, tip.y - thumbTip.y) < 0.08

                const indexNear = nearThumb(indexTip)
                const middleNear = nearThumb(middleTip)
                const ringNear = nearThumb(ringTip)
                const pinkyNear = nearThumb(pinkyTip)

                // GESTURE 1: index pointing — only index extended, rest curled
                const isPointing = indexUp && !middleUp && !ringUp && !pinkyUp

                // GESTURE 2: 4 fingers touching thumb — fly
                const isFlying = indexNear && middleNear && ringNear && pinkyNear

                // GESTURE 3: open hand — all 4 fingers extended
                const isOpen = indexUp && middleUp && ringUp && pinkyUp

                handInput.gesture = isPointing ? 'point' : isFlying ? 'fly' : isOpen ? 'open' : 'none'

                // Fire point gesture once per trigger
                if (isPointing && !wasPointing.current) {
                    handInput.pointJustFired = true
                }
                wasPointing.current = isPointing

                // Fly gesture active while held
                handInput.flying = isFlying

                // Draw skeleton
                const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]]
                ctx.strokeStyle = 'rgba(255,255,255,0.4)'
                ctx.lineWidth = 1
                connections.forEach(([a, b]) => {
                    ctx.beginPath()
                    ctx.moveTo((1 - lm[a].x) * 160, lm[a].y * 120)
                    ctx.lineTo((1 - lm[b].x) * 160, lm[b].y * 120)
                    ctx.stroke()
                })

                // Fingertip dots — colour by role
                const tipColors = {
                    4: isFlying ? '#ff6644' : '#ffffff',
                    8: isPointing ? '#44ffaa' : '#ffffff',
                    12: isFlying ? '#ff6644' : '#ffffff',
                    16: isFlying ? '#ff6644' : '#ffffff',
                    20: isFlying ? '#ff6644' : '#ffffff',
                }
                    ;[4, 8, 12, 16, 20].forEach(i => {
                        ctx.beginPath()
                        ctx.arc((1 - lm[i].x) * 160, lm[i].y * 120, 5, 0, Math.PI * 2)
                        ctx.fillStyle = tipColors[i] || '#fff'
                        ctx.fill()
                    })

                const gestureLabel = isPointing ? '☞ ABRIR IMAGEN'
                    : isFlying ? '✦ VOLANDO'
                        : isOpen ? '✋ DETENIDO'
                            : 'MOVER PARA MIRAR'
                setLabel(gestureLabel)
            })

            const processFrame = async () => {
                if (videoRef.current?.readyState === 4) await hands.send({ image: videoRef.current })
                rafRef.current = requestAnimationFrame(processFrame)
            }
            rafRef.current = requestAnimationFrame(processFrame)
            setStatus('running')
            setActive(true)
            setLabel('MOSTRÁ TU MANO')
        } catch (e) {
            console.error('Hand tracking error:', e)
            setStatus('error')
        }
    }

    const recalibrate = () => {
        neutralX.current = null
        neutralY.current = null
        smoothX.current = 0
        smoothY.current = 0
    }

    const stop = () => {
        cancelAnimationFrame(rafRef.current)
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop())
            videoRef.current.srcObject = null
        }
        handInput.active = false
        handInput.flying = false
        neutralX.current = null
        prevPalmPos.current = null
        pinchMoveDist.current = 0
        setActive(false)
        setStatus('idle')
    }

    return (
        <div style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        }}>
            <div style={{
                borderRadius: 10, overflow: 'hidden', position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                border: `1px solid ${handInput.pinching ? 'rgba(255,80,80,0.6)' : 'rgba(255,255,255,0.15)'}`,
                display: active ? 'block' : 'none',
                transition: 'border-color 0.2s',
            }}>
                <video ref={videoRef} width={160} height={120}
                    style={{ display: 'block', transform: 'scaleX(-1)' }} muted playsInline />
                <canvas ref={canvasRef} width={160} height={120}
                    style={{ position: 'absolute', top: 0, left: 0 }} />
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.45)', padding: '4px 0',
                    textAlign: 'center', fontSize: 9,
                    color: 'rgba(255,255,255,0.9)', fontFamily: 'serif', letterSpacing: '0.08em'
                }}>
                    {label}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
                {active && (
                    <button onClick={recalibrate} style={{
                        background: 'rgba(255,252,245,0.85)', backdropFilter: 'blur(8px)',
                        border: 'none', borderRadius: 6, cursor: 'pointer',
                        padding: '9px 14px', fontFamily: 'serif', letterSpacing: '0.08em',
                        fontSize: 11, color: '#2a2520', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>↺ CENTRO</button>
                )}
                <button onClick={active ? stop : start} style={{
                    background: active
                        ? 'linear-gradient(135deg, rgba(40,120,80,0.95), rgba(40,160,100,0.95))'
                        : 'rgba(255,252,245,0.85)',
                    backdropFilter: 'blur(8px)', border: 'none', borderRadius: 6,
                    cursor: 'pointer', padding: '9px 18px',
                    fontFamily: 'serif', letterSpacing: '0.1em',
                    fontSize: 11, color: active ? '#fff' : '#2a2520',
                    boxShadow: active ? '0 2px 12px rgba(40,160,80,0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                }}>
                    {status === 'loading' ? 'CARGANDO...' : active ? '✋ DESACTIVAR' : '✋ MANO'}
                </button>
            </div>
        </div>
    )
}

function TouchJoystick() {
    const [state, setState] = useState({ active: false, baseX: 0, baseY: 0, dx: 0, dy: 0 })
    const frameRef = useRef()

    useEffect(() => {
        const tick = () => {
            setState({ ...joystickState })
            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameRef.current)
    }, [])

    if (!state.active) return null

    const MAX = 60
    const clampedDx = Math.max(-MAX, Math.min(MAX, state.dx))
    const clampedDy = Math.max(-MAX, Math.min(MAX, state.dy))

    return (
        <div style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 15,
            left: state.baseX - MAX, top: state.baseY - MAX
        }}>
            {/* Outer ring */}
            <div style={{
                width: MAX * 2, height: MAX * 2, borderRadius: '50%',
                border: '2px solid rgba(255,252,245,0.35)',
                background: 'rgba(255,252,245,0.07)',
                position: 'relative',
            }}>
                {/* Inner knob */}
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,252,245,0.5)',
                    backdropFilter: 'blur(4px)',
                    position: 'absolute',
                    left: MAX - 18 + clampedDx,
                    top: MAX - 18 + clampedDy,
                    transition: 'none',
                }} />
            </div>
        </div>
    )
}

function LSDOverlay() {
    const frameRef = useRef()
    const overlayRef = useRef()
    const t = useRef(0)

    useEffect(() => {
        const tick = () => {
            t.current += 0.016
            dreamState.breathe = t.current

            // Flash decays
            dreamState.flashIntensity = Math.max(0, dreamState.flashIntensity - 0.04)
            dreamState.distort = Math.max(0, dreamState.distort - 0.005)

            if (overlayRef.current) {
                const flash = dreamState.flashIntensity
                const dist = dreamState.distort
                const breathe = Math.sin(t.current * 0.4) * 0.5 + 0.5

                // Hue rotate + saturate based on dream state
                const hueRot = (dreamState.hueShift * 360).toFixed(1)
                const sat = (1 + dist * 2).toFixed(2)
                const blurPx = (dist * 3).toFixed(2)

                overlayRef.current.style.filter =
                    `hue-rotate(${hueRot}deg) saturate(${sat}) blur(${blurPx}px)`

                // Flash overlay
                overlayRef.current.style.background =
                    `radial-gradient(ellipse at center,
                        rgba(255,255,255,${(flash * 0.7).toFixed(2)}) 0%,
                        rgba(255,255,255,0) 70%)`

                // Vignette breathes with dream intensity
                overlayRef.current.style.boxShadow =
                    `inset 0 0 ${(80 + breathe * 40 + dist * 120).toFixed(0)}px
                     ${(40 + dist * 80).toFixed(0)}px
                     rgba(0,0,0,${(0.08 + dist * 0.25).toFixed(2)})`
            }

            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameRef.current)
    }, [])

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed', inset: 0,
                pointerEvents: 'none', zIndex: 4,
                mixBlendMode: 'normal',
                transition: 'filter 0.3s ease',
            }}
        />
    )
}

function SpeedVignette() {
    const [vigOpacity, setVigOpacity] = useState(0)
    const frameRef = useRef()

    useEffect(() => {
        const tick = () => {
            const s = speedRef.current
            const target = THREE.MathUtils.clamp((s - 2) / 14, 0, 0.55)
            setVigOpacity(prev => prev + (target - prev) * 0.08)
            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameRef.current)
    }, [])

    return (
        <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5,
            opacity: vigOpacity,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255, 252, 245, 0.85) 100%)',
        }} />
    )
}

export default function App() {
    const [items, setItems] = useState([])
    const [progress, setProgress] = useState(0)
    const [selectedImage, setSelectedImage] = useState(null)

    const phrases = [
        "A talking organism", "#BUÓH", "Elefantes en el Bazar", "Mi Cuerpo Eléctrico",
        "Todo lo que brilla es oro", "Working Progress", "La Llave y el Testigo",
        "Paisajes psíquicos", "Criaturas esotéricas", "Pinturas rupestres extraterrestres",
        "Besos Brujos", "Diego De Aduriz"
    ]

    // Wire pinch gesture to open images + trigger LSD flash
    useEffect(() => {
        pinchClickCallback.current = (url) => {
            dreamState.flashIntensity = 1
            dreamState.hueShift = (dreamState.hueShift + 0.15 + Math.random() * 0.2) % 1
            setSelectedImage(url)
        }
    }, [])

    useEffect(() => {
        THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
            setProgress(Math.round((loaded / total) * 100))
        }
        fetch('../3d-images.json')
            .then(r => r.json())
            .then(images => {
                images.sort(() => Math.random() - 0.5)
                setItems(generatePositions(images, phrases))
            })
    }, [])

    return (
        <>
            {progress < 100 && (
                <div className="loading-wrapper">
                    <div className="loading-text">UNIVERSO DDA CARGANDO... {progress}%</div>
                    <div className="loading-bar-container">
                        <div className="loading-bar" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="overlay header">UNIVERSO DDA</div>
            <a href="../index.html" className="overlay close-btn" style={{ pointerEvents: 'auto' }}>CERRAR</a>

            <LSDOverlay />
            <SpeedVignette />
            <HandTracker />
            <TouchJoystick />

            <div className="gallery-instructions">
                TAP PARA VOLAR &nbsp;·&nbsp; ARRASTRAR PARA MIRAR &nbsp;·&nbsp; FLECHAS PARA MOVER &nbsp;·&nbsp; CLICK EN OBRA PARA ABRIR
            </div>

            {selectedImage && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(255, 252, 245, 0.85)', backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 1, animation: 'fadeIn 0.4s ease-out forwards',
                        pointerEvents: 'auto', cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: 'absolute', top: 30, right: 40, color: '#887c6b', fontFamily: 'sans-serif', fontSize: '18px', letterSpacing: '2px' }}>
                        CLOSE
                    </div>
                    <img
                        src={selectedImage}
                        style={{
                            maxWidth: '90%', maxHeight: '90%',
                            objectFit: 'contain',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                        alt="Enlarged gallery view"
                    />
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes scaleIn { from { transform: scale(0.95); } to { transform: scale(1); } }
                    `}</style>
                </div>
            )}

            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 12000 }}
                gl={{ toneMapping: THREE.NoToneMapping }}
                style={{ touchAction: 'none', outline: 'none' }}
                tabIndex={-1}
                onMouseDown={e => e.currentTarget.blur()}
            >
                <DynamicBackground />
                <Suspense fallback={null}>
                    <Scene items={items} onImageClick={setSelectedImage} />
                </Suspense>
            </Canvas>
        </>
    )
}