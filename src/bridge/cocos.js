/**
 * Cocos Creator Bridge Script
 * This script runs in the context of the inspected page.
 */
window.__COCOS_INSPECTOR__ = {
  getCC() {
    return window.cc || (window.internal && window.internal.cc);
  },

  getNodeTree() {
    const cc = this.getCC();
    if (!cc) return null;

    const scene = cc.director.getScene();
    if (!scene) return null;

    const serializeNode = (node) => {
      let type = 'Node';
      const getComp = (name) => node.getComponent(name) || node.getComponent(name.replace('cc.', ''));
      
      if (getComp('cc.Sprite')) type = 'Sprite';
      else if (getComp('cc.Label')) type = 'Label';
      else if (getComp('cc.Button')) type = 'Button';
      else if (getComp('cc.Canvas')) type = 'Canvas';
      else if (getComp('cc.Camera')) type = 'Camera';
      else if (getComp('cc.RichText')) type = 'RichText';
      else if (getComp('cc.EditBox')) type = 'EditBox';
      else if (getComp('cc.ProgressBar')) type = 'ProgressBar';
      else if (getComp('cc.ScrollView')) type = 'ScrollView';
      else if (getComp('cc.Toggle')) type = 'Toggle';
      else if (getComp('cc.ParticleSystem')) type = 'Particle';
      else if (getComp('cc.Widget')) type = 'Widget';
      else if (getComp('cc.Layout')) type = 'Layout';

      const data = {
        uuid: node.uuid,
        name: node.name,
        active: node.active,
        type: type,
        children: []
      };

      if (node.children) {
        data.children = node.children.map(child => serializeNode(child));
      }
      return data;
    };

    return scene.children.map(node => serializeNode(node));
  },

  getNodeDetail(uuid) {
    const node = this.findNodeByUuid(uuid);
    if (!node) return null;

    const cc = this.getCC();
    const detail = {
      uuid: node.uuid,
      name: node.name,
      active: node.active,
      components: []
    };

    // Add cc.Node as a virtual component for transform properties
    detail.components.push({
      type: 'cc.Node',
      enabled: node.active,
      props: [
        { name: 'name', value: node.name, type: 'string' },
        { name: 'position', value: { x: node.x, y: node.y, z: node.z || 0 }, type: 'vec3' },
        { name: 'rotation', value: node.angle || node.rotation || 0, type: 'number' },
        { name: 'scale', value: { x: node.scaleX, y: node.scaleY, z: node.scaleZ || 1 }, type: 'vec3' },
        { name: 'anchor', value: { x: node.anchorX, y: node.anchorY }, type: 'vec2' },
        { name: 'size', value: { width: node.width, height: node.height }, type: 'size' },
        { name: 'opacity', value: node.opacity, type: 'number' },
        { name: 'color', value: node.color ? { r: node.color.r, g: node.color.g, b: node.color.b } : null, type: 'color' },
        { name: 'group', value: node.group || 'default', type: 'string' }
      ]
    });

    // Get real components
    const components = node.getComponents(cc.Component);
    components.forEach(comp => {
      const className = comp.constructor.name || 'Component';
      const compName = comp.name || className;
      
      const compData = {
        type: compName,
        enabled: comp.enabled !== undefined ? comp.enabled : true,
        props: []
      };

      // Extract real class name if format is "name<Type>"
      let realType = className;
      const match = compName.match(/<([^>]+)>/);
      if (match) {
        realType = match[1];
      }

      // Collect properties
      const propMap = new Map();
      
      // 1. Common public properties based on type
      const commonProps = this.getCommonPropsForType(realType, comp, cc);
      commonProps.forEach(p => propMap.set(p.name, p));

      // 2. Discoverable properties
      const keys = Object.keys(comp);
      keys.forEach(key => {
        if (key.startsWith('_') || key.startsWith('$') || key === 'enabled' || key === 'node' || key === 'name') return;
        if (propMap.has(key)) return;

        const val = comp[key];
        const prop = this.serializeProperty(key, val, cc);
        if (prop) propMap.set(key, prop);
      });

      compData.props = Array.from(propMap.values());
      detail.components.push(compData);
    });

    return detail;
  },

  getCommonPropsForType(type, comp, cc) {
    const props = [];
    const add = (name) => {
      const val = comp[name];
      if (val === undefined) return;
      const prop = this.serializeProperty(name, val, cc);
      if (prop) props.push(prop);
    };

    if (type === 'Sprite' || type === 'cc.Sprite') {
      ['sizeMode', 'type', 'fillType', 'fillCenter', 'fillStart', 'fillRange'].forEach(add);
    } else if (type === 'Label' || type === 'cc.Label') {
      ['string', 'horizontalAlign', 'verticalAlign', 'fontSize', 'lineHeight', 'overflow', 'enableWrapText'].forEach(add);
    } else if (type === 'Button' || type === 'cc.Button') {
      ['interactable', 'enableAutoGrayScale', 'transition', 'zoomScale', 'duration'].forEach(add);
    } else if (type === 'Widget' || type === 'cc.Widget') {
      ['isAlignTop', 'isAlignBottom', 'isAlignLeft', 'isAlignRight', 'top', 'bottom', 'left', 'right'].forEach(add);
    } else if (type === 'Layout' || type === 'cc.Layout') {
      ['type', 'resizeMode', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'spacingX', 'spacingY'].forEach(add);
    } else if (type === 'ProgressBar' || type === 'cc.ProgressBar') {
      ['totalLength', 'progress', 'mode'].forEach(add);
    } else if (type === 'EditBox' || type === 'cc.EditBox') {
      ['string', 'placeholder', 'inputMode', 'inputFlag', 'returnType', 'maxLength'].forEach(add);
    }

    return props;
  },

  serializeProperty(key, val, cc) {
    const type = typeof val;
    if (type === 'number' || type === 'string' || type === 'boolean') {
      return { name: key, value: val, type: type };
    } else if (val && val instanceof cc.Node) {
      return { name: key, value: { uuid: val.uuid, name: val.name }, type: 'cc.Node' };
    } else if (val && val instanceof cc.Color) {
      return { name: key, value: { r: val.r, g: val.g, b: val.b }, type: 'color' };
    } else if (val && (val instanceof cc.Vec2 || val instanceof cc.Size || (val.x !== undefined && val.y !== undefined && val.z === undefined))) {
      return { name: key, value: { x: val.x || val.width, y: val.y || val.height }, type: val instanceof cc.Size ? 'size' : 'vec2' };
    } else if (val && (val instanceof cc.Vec3 || (val.x !== undefined && val.y !== undefined && val.z !== undefined))) {
      return { name: key, value: { x: val.x, y: val.y, z: val.z }, type: 'vec3' };
    }
    return null;
  },

  updateComponentProperty(uuid, compType, prop, value) {
    const node = this.findNodeByUuid(uuid);
    if (!node) return;

    let target;
    if (compType === 'cc.Node') {
      target = node;
    } else {
      const cc = this.getCC();
      // Try match by full name (like "bg<Sprite>") or just the class name
      target = node.getComponents(cc.Component).find(c => {
        const className = c.constructor.name;
        const compName = c.name || className;
        if (compName === compType || className === compType) return true;
        
        // Match Type if compType is Sprite and compName is bg<Sprite>
        const match = compName.match(/<([^>]+)>/);
        if (match && match[1] === compType) return true;
        
        // Handle cc. prefix
        const cleanCompType = compType.replace('cc.', '');
        if (className === cleanCompType || (match && match[1] === cleanCompType)) return true;
        
        return false;
      });
    }

    if (!target) return;

    if (prop.includes('.')) {
      const parts = prop.split('.');
      let obj = target;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      target[prop] = value;
    }
  },

  findNodeByUuid(uuid, root) {
    const cc = this.getCC();
    if (!root) root = cc.director.getScene();
    if (root.uuid === uuid) return root;
    for (const child of root.children) {
      const found = this.findNodeByUuid(uuid, child);
      if (found) return found;
    }
    return null;
  },

  logNode(uuid) {
    const node = this.findNodeByUuid(uuid);
    if (node) {
      console.log(`%c[Cocos Inspector] Node: ${node.name}`, "color: #00bcd4; font-weight: bold;", node);
      window.$node = node;
      console.log("Access it via $node");
    }
  },

  getNodePath(uuid) {
    let node = this.findNodeByUuid(uuid);
    if (!node) return "";
    let path = node.name;
    while (node.parent && node.parent.name !== "New Scene") {
      node = node.parent;
      path = node.name + "/" + path;
    }
    return path;
  }
};
