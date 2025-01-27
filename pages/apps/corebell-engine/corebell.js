class Corebell {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found.`);
    }

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLighting();
    this.initGrid();
    this.addGroundPlane();

    this.objects = [];
    this.selectedObject = null;

    this.animate = this.animate.bind(this);
    window.addEventListener("resize", () => this.onWindowResize());
    this.container.addEventListener("click", (event) => this.onClick(event));

    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  initControls() {
    this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;

    this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener("dragging-changed", (event) => {
      this.orbitControls.enabled = !event.value;
    });
    this.scene.add(this.transformControls);

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);
  }

  initGrid() {
    this.gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(this.gridHelper);
  }

  addGroundPlane() {
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);
  }

  addObject(type) {
    let geometry;
    const material = new THREE.MeshStandardMaterial({ color: 0x007bff });

    switch (type) {
      case "cube":
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      default:
        console.error(`Unknown object type: ${type}`);
        return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.set(0, 1, 0);
    this.scene.add(mesh);

    this.objects.push(mesh);
    this.selectObject(mesh);
  }

  selectObject(object) {
    this.selectedObject = object;
    this.transformControls.attach(object);
  }

  deleteSelectedObject() {
    if (!this.selectedObject) return;
    this.scene.remove(this.selectedObject);
    this.objects = this.objects.filter((obj) => obj !== this.selectedObject);
    this.transformControls.detach();
    this.selectedObject = null;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onClick(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.objects);
    if (intersects.length > 0) {
      this.selectObject(intersects[0].object);
    }
  }

  onKeyDown(event) {
    if (!this.selectedObject) return;

    switch (event.key) {
      case "t":
        this.transformControls.setMode("translate");
        break;
      case "r":
        this.transformControls.setMode("rotate");
        break;
      case "s":
        this.transformControls.setMode("scale");
        break;
      case "Delete":
        this.deleteSelectedObject();
        break;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize Corebell
document.addEventListener("DOMContentLoaded", () => {
  const engine = new Corebell("viewport");

  document.getElementById("addCube").addEventListener("click", () => engine.addObject("cube"));
  document.getElementById("addSphere").addEventListener("click", () => engine.addObject("sphere"));
  document.getElementById("toggleGrid").addEventListener("click", () => engine.gridHelper.visible = !engine.gridHelper.visible);
  document.getElementById("deleteObject").addEventListener("click", () => engine.deleteSelectedObject());
  document.getElementById("lightIntensity").addEventListener("input", (e) => {
    engine.directionalLight.intensity = parseFloat(e.target.value);
  });
});
