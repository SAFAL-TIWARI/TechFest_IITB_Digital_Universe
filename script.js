(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("universe-canvas");
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();

  gsap.registerPlugin(ScrollTrigger);

  const state = {
    cityProgress: 0,
    journeyProgress: 0,
    heroProgress: 0
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050717, 0.028);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2.2, 12);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowPowerDevice(),
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const root = new THREE.Group();
  const heroGroup = new THREE.Group();
  const cityGroup = new THREE.Group();
  const journeyGroup = new THREE.Group();
  scene.add(root, heroGroup, cityGroup, journeyGroup);

  addLights();
  const galaxy = createGalaxy();
  const heroSphere = createHeroSphere();
  const city = createCity();
  const journey = createJourney();

  root.add(galaxy);
  heroGroup.add(heroSphere.group);
  cityGroup.add(city.group);
  journeyGroup.add(journey.group);

  cityGroup.position.set(0, -5.5, -12);
  journeyGroup.position.set(0, -8, -10);

  initGsap();
  initInteractions();
  initModal();
  initCounters();
  initChallengeCube();

  requestAnimationFrame(animate);

  window.addEventListener("load", () => {
    document.querySelector(".preloader")?.classList.add("is-hidden");
    ScrollTrigger.refresh();
  });

  window.addEventListener("resize", onResize);

  function addLights() {
    const ambient = new THREE.AmbientLight(0x7ee7ff, 0.52);
    const cyan = new THREE.PointLight(0x39e8ff, 2.2, 70);
    const purple = new THREE.PointLight(0xb750ff, 2.6, 80);
    cyan.position.set(-8, 5, 8);
    purple.position.set(8, -2, 5);
    scene.add(ambient, cyan, purple);
  }

  function createGalaxy() {
    const count = isLowPowerDevice() ? 1200 : 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorA = new THREE.Color(0x39e8ff);
    const colorB = new THREE.Color(0xb750ff);
    const colorC = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = Math.random() * 36 + 5;
      const branch = (i % 5) / 5 * Math.PI * 2;
      const spin = radius * 0.18;
      const random = Math.pow(Math.random(), 2) * 8;
      const randomSign = () => (Math.random() < 0.5 ? -1 : 1);

      positions[i3] = Math.cos(branch + spin) * radius + random * randomSign();
      positions[i3 + 1] = (Math.random() - 0.5) * 14;
      positions[i3 + 2] = Math.sin(branch + spin) * radius + random * randomSign();

      const mixed = colorA.clone().lerp(colorB, Math.random()).lerp(colorC, Math.random() * 0.18);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.position.z = -10;
    return points;
  }

  function createHeroSphere() {
    const group = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(1.85, 64, 64);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x39e8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.32
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xb750ff,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending
    });
    const sphere = new THREE.Mesh(sphereGeometry, wireMaterial);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(2.05, 64, 64), glowMaterial);
    group.add(glow, sphere);

    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.35 + i * 0.28, 0.015, 12, 160),
        new THREE.MeshBasicMaterial({
          color: [0x39e8ff, 0x4e7dff, 0xb750ff][i],
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending
        })
      );
      ring.rotation.set(Math.PI / 2 + i * 0.42, i * 0.55, i * 0.2);
      group.add(ring);
    }

    const core = new THREE.PointLight(0x39e8ff, 2.5, 12);
    group.add(core);
    group.position.set(0, 0.25, 1.5);
    return { group, sphere };
  }

  function createCity() {
    const group = new THREE.Group();
    const buildings = [];
    const labels = ["Events", "Competitions", "Workshops", "Hackathons", "Speakers"];
    const palette = [0x39e8ff, 0x4e7dff, 0xb750ff, 0xff4fd8, 0x4dffb8];

    const ground = new THREE.GridHelper(24, 24, 0x39e8ff, 0x27385e);
    ground.material.transparent = true;
    ground.material.opacity = 0.38;
    group.add(ground);

    labels.forEach((label, index) => {
      const height = 1.8 + index * 0.48 + Math.random() * 1.2;
      const geometry = new THREE.BoxGeometry(1.25, height, 1.25);
      const material = new THREE.MeshStandardMaterial({
        color: 0x081329,
        emissive: palette[index],
        emissiveIntensity: 0.16,
        roughness: 0.35,
        metalness: 0.72
      });
      const building = new THREE.Mesh(geometry, material);
      building.position.set((index - 2) * 2.7, height / 2, -Math.abs(index - 2) * 0.7);
      building.userData = { label, baseEmissive: 0.16 };
      buildings.push(building);
      group.add(building);

      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12),
        new THREE.MeshBasicMaterial({ color: palette[index] })
      );
      antenna.position.set(building.position.x, height + 0.55, building.position.z);
      group.add(antenna);
    });

    for (let i = 0; i < 24; i += 1) {
      const stream = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.035, 4 + Math.random() * 5),
        new THREE.MeshBasicMaterial({
          color: palette[i % palette.length],
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending
        })
      );
      stream.position.set((Math.random() - 0.5) * 18, 1 + Math.random() * 4, (Math.random() - 0.5) * 12);
      stream.rotation.y = Math.random() * Math.PI;
      stream.userData.speed = 0.008 + Math.random() * 0.018;
      group.add(stream);
    }

    return { group, buildings };
  }

  function createJourney() {
    const group = new THREE.Group();

    const rocket = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 2.2, 32),
      new THREE.MeshStandardMaterial({ color: 0xe8f7ff, metalness: 0.5, roughness: 0.24 })
    );
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.72, 32),
      new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0x4e001e, emissiveIntensity: 0.4 })
    );
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x39e8ff, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending })
    );
    body.rotation.z = 0.2;
    nose.position.y = 1.45;
    flame.position.y = -1.48;
    flame.rotation.x = Math.PI;
    rocket.add(body, nose, flame);
    rocket.position.set(-5, -1, 0);

    const satellite = new THREE.Group();
    const satCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x4e7dff, emissive: 0x1b2c80, emissiveIntensity: 0.5 })
    );
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x39e8ff, transparent: true, opacity: 0.55 });
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.55), panelMat);
    const panelR = panelL.clone();
    panelL.position.x = -1.05;
    panelR.position.x = 1.05;
    satellite.add(satCore, panelL, panelR);
    satellite.position.set(0.2, 0.7, -1);

    const drone = new THREE.Group();
    const droneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.18, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x111c3b, emissive: 0xb750ff, emissiveIntensity: 0.28 })
    );
    drone.add(droneBody);
    [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].forEach(([x, z]) => {
      const rotor = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.012, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x39e8ff })
      );
      rotor.position.set(x, 0, z);
      rotor.rotation.x = Math.PI / 2;
      drone.add(rotor);
    });
    drone.position.set(4, 0.4, 0);

    const network = new THREE.Group();
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x4dffb8 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x39e8ff, transparent: true, opacity: 0.56 });
    const nodes = [];
    for (let i = 0; i < 8; i += 1) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), nodeMat);
      node.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 3);
      nodes.push(node);
      network.add(node);
    }
    nodes.forEach((node, index) => {
      const next = nodes[(index + 2) % nodes.length];
      const geo = new THREE.BufferGeometry().setFromPoints([node.position, next.position]);
      network.add(new THREE.Line(geo, lineMat));
    });
    network.position.set(0, -0.8, -1.5);

    group.add(rocket, satellite, drone, network);
    return { group, rocket, satellite, drone, network, flame };
  }

  function initGsap() {
    gsap.from(".hero-copy > *", {
      y: 38,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out"
    });

    gsap.to(state, {
      heroProgress: 1,
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.utils.toArray(".timeline-card").forEach((card, index) => {
      card.style.setProperty("--depth", card.dataset.depth || 1);
      gsap.from(card, {
        y: 90,
        z: -140,
        rotateX: 18,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 82%"
        },
        delay: index * 0.04
      });
    });

    gsap.utils.toArray(".domain-card, .stat-card, .journey-grid article").forEach((item) => {
      gsap.from(item, {
        y: 48,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 86%"
        }
      });
    });

    gsap.to(state, {
      cityProgress: 1,
      scrollTrigger: {
        trigger: "#metaverse",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.to(state, {
      journeyProgress: 1,
      scrollTrigger: {
        trigger: "#journey",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.to(".city-labels span", {
      y: -18,
      opacity: 1,
      stagger: 0.08,
      scrollTrigger: {
        trigger: "#metaverse",
        start: "top 60%",
        toggleActions: "play none none reverse"
      }
    });

    if (!prefersReducedMotion) {
      gsap.to(".hero-copy", {
        y: -80,
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  function initInteractions() {
    window.addEventListener("pointermove", (event) => {
      targetPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetPointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      updateRobotLook(event.clientX, event.clientY);
    }, { passive: true });

    document.querySelectorAll(".domain-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 14;
        const rotateX = -((y / rect.height) - 0.5) * 14;
        card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    const robot = document.getElementById("robotAssistant");
    robot?.addEventListener("click", () => {
      robot.classList.add("is-waving");
      const bubble = robot.querySelector(".speech-bubble");
      if (bubble) bubble.textContent = "Systems online. Let's innovate.";
      window.setTimeout(() => robot.classList.remove("is-waving"), 1300);
    });
  }

  function updateRobotLook(clientX, clientY) {
    const robot = document.getElementById("robotAssistant");
    if (!robot) return;
    const rect = robot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (clientX - cx) / 420));
    const dy = Math.max(-1, Math.min(1, (clientY - cy) / 420));
    robot.style.transform = `rotateY(${dx * 18}deg) rotateX(${-dy * 10}deg) translateY(${Math.sin(clock.elapsedTime * 1.5) * 4}px)`;
  }

  function initModal() {
    const modal = document.getElementById("domainModal");
    const title = document.getElementById("modalTitle");
    const detail = document.getElementById("modalDetail");
    const close = modal?.querySelector(".modal-close");

    document.querySelectorAll(".domain-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (!modal || !title || !detail) return;
        title.textContent = card.dataset.domain || "Tech Domain";
        detail.textContent = card.dataset.detail || "";
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      });
    });

    const closeModal = () => {
      modal?.classList.remove("is-open");
      modal?.setAttribute("aria-hidden", "true");
    };
    close?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  function initCounters() {
    document.querySelectorAll("[data-count]").forEach((counter) => {
      const target = Number(counter.getAttribute("data-count") || 0);
      ScrollTrigger.create({
        trigger: counter,
        start: "top 84%",
        once: true,
        onEnter: () => {
          gsap.fromTo(counter, { textContent: 0 }, {
            textContent: target,
            duration: 2,
            ease: "power2.out",
            snap: { textContent: 1 },
            onUpdate: () => {
              const value = Number(counter.textContent || 0);
              counter.textContent = formatStat(value, target);
            }
          });
        }
      });
    });
  }

  function initChallengeCube() {
    const text = document.getElementById("challengeText");
    document.querySelectorAll(".cube-face").forEach((face) => {
      face.addEventListener("click", () => {
        if (text) text.textContent = face.dataset.challenge || "";
        gsap.fromTo(text, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
      });
    });
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    pointer.x += (targetPointer.x - pointer.x) * 0.06;
    pointer.y += (targetPointer.y - pointer.y) * 0.06;

    galaxy.rotation.y = elapsed * 0.018;
    galaxy.rotation.x = Math.sin(elapsed * 0.2) * 0.03;

    heroGroup.rotation.y = pointer.x * 0.28;
    heroGroup.rotation.x = -pointer.y * 0.18;
    heroGroup.position.y = Math.sin(elapsed * 1.2) * 0.15 - state.heroProgress * 2.5;
    heroGroup.scale.setScalar(1 - state.heroProgress * 0.18);
    heroSphere.group.children.forEach((child, index) => {
      if (child.type === "Mesh") child.rotation.z += 0.002 + index * 0.0009;
    });

    cityGroup.visible = state.cityProgress > 0.02;
    cityGroup.position.z = -15 + state.cityProgress * 14;
    cityGroup.position.y = -5.4 + state.cityProgress * 5.2;
    cityGroup.rotation.y = -0.32 + state.cityProgress * 0.58 + pointer.x * 0.08;
    city.buildings.forEach((building, index) => {
      building.material.emissiveIntensity = 0.16 + Math.max(0, Math.sin(elapsed * 2 + index)) * 0.85 * state.cityProgress;
      building.scale.y = 1 + Math.sin(elapsed * 1.2 + index) * 0.025;
    });
    city.group.children.forEach((child) => {
      if (child.userData.speed) {
        child.position.z += child.userData.speed;
        if (child.position.z > 7) child.position.z = -7;
      }
    });

    journeyGroup.visible = state.journeyProgress > 0.02;
    journeyGroup.position.y = -7 + state.journeyProgress * 6.5;
    journeyGroup.rotation.y = pointer.x * 0.12;
    journey.rocket.position.y = -2 + state.journeyProgress * 5.8;
    journey.rocket.position.x = -5 + state.journeyProgress * 2.2;
    journey.rocket.rotation.z = -0.45 + state.journeyProgress * 0.7;
    journey.flame.scale.y = 1 + Math.sin(elapsed * 18) * 0.28;
    journey.satellite.rotation.y = elapsed * 0.8;
    journey.drone.position.y = Math.sin(elapsed * 2.2) * 0.35 + 0.4;
    journey.drone.position.x = 3.8 + Math.sin(elapsed * 0.9) * 0.6;
    journey.drone.rotation.y = elapsed * 0.45;
    journey.network.scale.setScalar(0.6 + state.journeyProgress * 0.8);
    journey.network.rotation.y = elapsed * 0.22;

    camera.position.x = pointer.x * 0.5;
    camera.position.y = 2.2 + pointer.y * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    ScrollTrigger.refresh();
  }

  function formatStat(value, target) {
    const rounded = Math.floor(value);
    if (target >= 1000) return `${rounded.toLocaleString("en-IN")}+`;
    if (target === 30) return `${rounded}`;
    return `${rounded}+`;
  }

  function isLowPowerDevice() {
    return window.innerWidth < 760 || navigator.hardwareConcurrency <= 4;
  }
})();
