import React, { useMemo, useEffect, useRef, useState } from "react";

import { areaWearables, areaFeatures } from '../constant/config';

import "./polygonCanvas.css";

import PolygonLabelImage from "../utils/polygonLabelImage";
import PresetAreaAction from "../component/presetArea";

const FabricPolygonComponent = () => {
  const canvasRef = useRef(null);

  const [canvas, setcanvas] = useState(null);
  const [type, settype] = useState("polygonOn");
  const [value, setvalue] = useState(2);
  const [preType, setpreType] = useState('');
  const [selectValue, setselectValue] = useState('Glasses')

  const [error, seterror] = useState('')

  useEffect(() => {
    const canvasContent = canvasRef.current;

    const initCanvas = new PolygonLabelImage({
      canvas: canvasContent,
      canvasConfig: {
        height: 488,
        width: 488,
        selection: false,
        enableRetinaScaling: true,
        // centeredScaling: false,
        // selectable: false,
        // hasControls: false,
        // hasBorders: false,
        // objectCaching: true,
        // lockMovementX: true,
        // lockMovementY: true,
        preserveObjectStacking: true,
      },
    });

    initCanvas.resetFeaturesAttr("polygonOn", true);

    setcanvas(initCanvas);
    initCanvas.setImage("https://i.ibb.co/vXMQhVx/000064.png");
  }, []);

  const handlePolygon = () => {
    settype("polygonOn");
    canvas.clearNoPolygon();
    canvas.splitGroup();
    canvas.resetFeaturesAttr("polygonOn", true);
  };
  const handleErase = () => {
    settype("eraseOn");
    canvas.clearNoPolygon();
    canvas.splitGroup();
    canvas.resetFeaturesAttr("eraseOn", true);
  };
  const handleDownload = () => {
    settype("downOn");
    canvas.clearNoPolygon();
    canvas.splitGroup();
    canvas.resetFeaturesAttr("downOn", true);
    canvas.handleToDataURL();
  };

  const handleDrag = () => {
    settype("dragOn");
    canvas.clearNoPolygon();
    canvas.resetFeaturesAttr("dragOn", true);

    canvas.toGroup();
  };

  const handleDragAction = (type) => {
    canvas.moveDragByKeyboard(type, value);
  };

  const handlePreAction = (type, radio) => {
    setpreType(type)
    if(typeof radio === 'number') {
      canvas.clearAll();
      seterror('')
      if(radio) {
        // ?????????????????????
        canvas.presetAreaRect(radio);
      }
    } else {
      const preResult = localStorage.getItem(type);
      if(preResult) {
        canvas.clearAll();
        canvas.setPreset(JSON.parse(preResult))
        seterror('')
      } else {
        seterror('??????????????????');
      }
    }
  }

  const handleSave = () => {
    const objs = canvas.getSavePresetObject();
    if(objs) {
      localStorage.setItem(selectValue, JSON.stringify(objs));
      seterror('')
    } else {
      seterror('????????????????????????')
    }
  }
  return (
    <div className="container">
      <div>
        <div className="polygonCanvasView">
          <canvas ref={canvasRef} width="600" height="600" className="canvas">
            ????????????????????????canvas?????????????????????.
          </canvas>
        </div>
        <div>
          <button
            className={type === "polygonOn" ? "active" : ""}
            onClick={handlePolygon}
          >
            Area Select
          </button>
          <button
            className={type === "eraseOn" ? "active" : ""}
            onClick={handleErase}
          >
            Area Erase
          </button>

          <button
            className={type === "dragOn" ? "active" : ""}
            onClick={handleDrag}
          >
            drag
          </button>

          <button
            className={type === "downOn" ? "active" : ""}
            onClick={handleDownload}
          >
            result
          </button>
          {type === "dragOn" && (
            <div className="drag-action">
              <div>
                <span onClick={() => handleDragAction("top")}>???</span>
                <span onClick={() => handleDragAction("bottom")}>???</span>
              </div>
              <input
                type="number"
                onChange={(e) => setvalue(e.target.value)}
                value={value}
                min={1}
                max={100}
              />
              <div>
                <span onClick={() => handleDragAction("left")}>???</span>
                <span onClick={() => handleDragAction("right")}>???</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <PresetAreaAction onClick={handlePreAction} type={preType}/>
        <div>
          <h2>??????????????????</h2>
          <select className="select-view" value={selectValue} onChange={(e) => setselectValue(e.target.value)}>
            {
              [...areaWearables, ...areaFeatures].map(item => (
                <option key={item} value={item}>{item}</option>
              ))
            }
          </select>
          <button className="button" onClick={handleSave}>??????????????????</button>
        </div>

        <h1 style={{color: 'red'}}>{error}</h1>
      </div>
    </div>
  );
};

export default FabricPolygonComponent;
