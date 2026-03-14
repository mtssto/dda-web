import React, { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Shared ref for camera speed (used by vignette overlay)
const speedRef = { current: 0 }

// Click target — where camera should fly to
const flyTarget = { current: null }

// Set true when pointer goes down on a 3D mesh — suppresses fly-to
const pointerOnMesh = { current: false }

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

    useFrame(() => {
        if (!groupRef.current) return

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

        // Fade in based on distance — appear as you approach
        if (meshRef.current?.material) {
            const dist = camera.position.distanceTo(new THREE.Vector3(...position))
            const targetOpacity = dist < 1800 ? THREE.MathUtils.clamp((1800 - dist) / 1000, 0, 1) : 0
            opacity.current = THREE.MathUtils.lerp(opacity.current, targetOpacity, 0.04)
            meshRef.current.material.opacity = opacity.current
            if (glowRef.current) glowRef.current.material.opacity = opacity.current * 0.06
        }

        if (!meshRef.current) return

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

        const targetScale = hovered ? 1.04 : 1
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.05))
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
                onPointerDown={(e) => { e.stopPropagation(); pointerOnMesh.current = true }}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    flyTarget.current = null;
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
        const dist = camera.position.distanceTo(new THREE.Vector3(...position))
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
            yawVel.current   = Math.max(-0.03, Math.min(0.03, yawVel.current   - dx * sensitivity))
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

        const onTouchStart = (e) => {
            const t = e.touches[0]
            onPointerDown(t.clientX, t.clientY)
        }
        const onTouchMove = (e) => {
            e.preventDefault()
            const t = e.touches[0]
            onPointerMove(t.clientX, t.clientY)
        }
        const onTouchEnd = (e) => {
            const t = e.changedTouches[0]
            onPointerUp(t.clientX, t.clientY)
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
        pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current))
        yawVel.current   = Math.max(-0.03, Math.min(0.03, yawVel.current   * ROT_FRICTION))
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

function DynamicBackground() {
    const { scene, camera } = useThree()
    const color = useRef(new THREE.Color('#081b33'))

    useEffect(() => {
        scene.background = color.current
        scene.fog = new THREE.Fog(color.current, 1500, 9000)
    }, [scene])

    useFrame(() => {
        // Shift between heavenly golden, pale pink, soft white, and sky blue
        // Hues: 0.1 (Gold/Orange), 0.55 (Sky Blue), 0.85 (Pink)
        const baseHue = 0.55
        const hueShift = (Math.sin(camera.position.x * 0.0003) * 0.2) + (Math.cos(camera.position.z * 0.0002) * 0.25) + (Math.sin(camera.position.y * 0.0008) * 0.1)
        
        let h = baseHue + hueShift
        if (h < 0) h += 1
        if (h > 1) h -= 1

        // Use very high lightness (0.75-0.9) to make it feel ethereal/heavenly
        const lightness = 0.82 + (Math.sin(Date.now() * 0.0005) * 0.08)
        
        const targetColor = new THREE.Color().setHSL(h, 0.45, lightness)
        color.current.lerp(targetColor, 0.015) // Smooth color transition interpolation
        
        scene.background = color.current
        if (scene.fog) {
            scene.fog.color = color.current
        }
    })

    return null
}

function Scene({ items, onImageClick }) {
    return (
        <>
            <CameraController />
            {items.map((item, i) => {
                if (item.type === 'image') return <ImageNode key={i} url={item.url} position={item.position} onImageClick={onImageClick} />
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
            ]
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
                -(400 + Math.random() * DEPTH * 0.8)
            ]
        })
    })

    combined.push({ type: 'end', position: [0, 0, -(DEPTH + 800)] })
    return combined
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

    useEffect(() => {
        THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
            setProgress(Math.round((loaded / total) * 100))
        }
        fetch('../3d-images.json')
            .then(r => r.json())
            .then(images => {
                images.sort(() => Math.random() - 0.5)
                const selected = images
                const phrases = [
                    "A talking organism", "#BUÓH", "Elefantes en el Bazar", "Mi Cuerpo Eléctrico",
                    "Todo lo que brilla es oro", "Working Progress", "La Llave y el Testigo",
                    "Paisajes psíquicos", "Criaturas esotéricas", "Pinturas rupestres extraterrestres",
                    "Besos Brujos", "Diego de Aduriz"
                ]
                setItems(generatePositions(selected, phrases))
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

            <SpeedVignette />

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