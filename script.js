import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
// import { faBus } from "https://cdn.jsdelivr.net/npm/@fortawesome/free-solid-svg-icons@6.5.2/index.min.js";
import { faSkull, faSkullCrossbones, faCrutch, faBurst, faUserInjured } from 'https://cdn.jsdelivr.net/npm/@fortawesome/free-solid-svg-icons@6.5.2/+esm';
import 'https://unpkg.com/commonmark@0.29.3/dist/commonmark.js';

const ICON_DEATH = faSkull;
const ICON_INJURY = faUserInjured;
const ICON_MINOR = faBurst;

class CrashUi extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Roboto';
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      position: fixed;
      top: 100px;
      left: 10px;
      padding: 10px;
      border-radius: 5px;
    }

    [fatal] {
      background-color: red;
    }

    [serious] {
      background-color: orange;
    }

    .crash-row {
      cursor: pointer;
    }

    .crash-row:hover {
      color: lightblue;
    }

    .header {
      font-size: 1.2rem;
      padding-block: 4px;
    }

    button {
      width: 100%;
      margin-top: 10px;
    }
  `;

  static get properties() {
    return {
      crashes: {type: Array},
      summary: {type: String},
    };
  }

  constructor() {
    super();
    this.crashes = [];
    this.summary = '';
  }

  render() {
    if (!this.crashes.length) {
      return html`Your flight looks safe.`;
    }
    const rows = this.crashes.map(crash => {
      let isFatal = false;
      let isSerious = false;
      if (crash.injuries.includes('Fatal')) {
        isFatal = true;
      } else if (crash.injuries.includes('Serious')) {
        isSerious = true;
      }
      return html`<div class="crash-row" ?fatal=${isFatal} ?serious=${isSerious} @click="${() => showDialog(crash)}">${crash.injuries}</div>`
    });
    return html`
      <div class="header">Accidents along your path</div>
      ${rows}
      <button @click="${this.summarize}">Summarize dangers</button>
    `;
  }

  async summarize(event) {
    event.target.textContent = 'Working...';

    const texts = [];

    let selectedCrashes = this.crashes.filter(crash => crash.injuries.includes('Fatal'));
    if (!selectedCrashes.length) {
      selectedCrashes = this.crashes.filter(crash => crash.injuries.includes('Serious'));
    }
    if (!selectedCrashes.length) {
      selectedCrashes = this.crashes;
    }
    for (const crash of selectedCrashes) {
      const text = await fetch(crash.path + '.txt').then(r => r.text());
      texts.push(text);
    }
    const summary = 'Calculating summary...';
    const response = await queryApi(texts.join('\n\n\n\n\n\n'));
    console.log(response);

    const message = response.choices[0].message.content;

    event.target.textContent = 'Summarize';
    this.showSummary(message);

    // "choices": [
    //   {
    //     "index": 0,
    //     "message": {
    //       "role": "assistant",
    //       "content": "Guide to Rio Vista, California:\n\n- Check fuel consumption and switch fuel tanks periodically.\n- Monitor engine performance closely, even if gauges remain normal.\n- Ensure landing gear integrity and functionality before landing.\n- Stay informed about recent maintenance history and repairs.\n- Be cautious of soft or unsuitable landing terrain.\n- Confirm fuel levels and refueling records carefully."
    //     },
    //     "logprobs": null,
    //     "finish_reason": "stop"
    //   }
    // ],

    // setTimeout(() => {

    // }, 1000);
  }

  showSummary(summary) {
    const dialog = document.createElement('dialog');
    const div = document.createElement('div');
    div.style.cssText = `
      width: 70vw;
      font-family: 'Roboto';
      white-space: pre-wrap;
    `;


    const reader = new commonmark.Parser();
    const writer = new commonmark.HtmlRenderer();
    const parsed = reader.parse(summary); // parsed is a 'Node' tree
    // transform parsed if you like...
    const result = writer.render(parsed); // result is a String
    // const tags = commonmark.

    div.innerHTML = result;
    dialog.appendChild(div);
    // document.body.appendChild(iframe);
    document.body.appendChild(dialog);
    dialog.showModal();
    // dialog.addEventListener('click', (event) => {
    //   if (event.target !== pre) {
    //     dialog.close();
    //   }
    // });
  }
}

async function queryApi(prompt) {
  const data = {
  "model": "gpt-4-0125-preview",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful flight assistant with one goal - you receive reports of crashes that historically happened along the planned route and your task is to give the user a briefing of what to care about along the way. Structure the briefing as a guide along the route and be very very concise. Here are the reports:"
      },
      {
        "role": "user",
        "content": prompt,
      }
    ]
  };
  const key = 'your-api-key';
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(data),
    });


    return response.json();
}

function showDialog(crash) {
  const dialog = document.createElement('dialog');
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: calc(100vw - 100px);
    height: calc(100vh - 100px);
  `;
  iframe.src = crash.path;
  dialog.appendChild(iframe);
  // document.body.appendChild(iframe);
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener('click', (event) => {
    if (event.target !== iframe) {
      dialog.close();
    }
  });
}

customElements.define('crash-ui', CrashUi);

let map;
// let flightPath;

// // Handles click events on a map, and adds a new point to the Polyline.
// function addLatLng(event) {
//   const path = flightPath.getPath();

//   // Because path is an MVCArray, we can simply append a new coordinate
//   // and it will automatically appear.
//   path.push(event.latLng);
//   // Add a new marker at the new plotted point on the polyline.
//   const market = new google.maps.Marker({
//     position: event.latLng,
//     title: "#" + path.getLength(),
//     draggable: true,
//     map: map,
//   });

//   marker.addListener("dragend", (event) => {
//     const position = draggableMarker.position;

//     // infoWindow.close();
//     // infoWindow.setContent(
//     //   `Pin dropped at: ${position.lat()}, ${position.lng()}`,
//     // );
//     // infoWindow.open(draggableMarker.map, draggableMarker);
//   });
// }

// async function initMap() {
//   const { Map } = await google.maps.importLibrary("maps");

//   map = new Map(document.getElementById("map"), {
//     center: { lat: 32.802986, lng: -115.55326 },
//     zoom: 8,
//   });

//   console.log(map);


//   // const flightPlanCoordinates = [
//   //   { lat: 37.772, lng: -122.214 },
//   //   { lat: 21.291, lng: -157.821 },
//   //   { lat: -18.142, lng: 178.431 },
//   //   { lat: -27.467, lng: 153.027 },
//   // ];
//   flightPath = new google.maps.Polyline({
//     // path: flightPlanCoordinates,
//     geodesic: true,
//     strokeColor: "#FF0000",
//     strokeOpacity: 1.0,
//     strokeWeight: 2,
//   });

//   flightPath.setMap(map);


//   map.addListener("click", addLatLng);



//   const crashes = await fetch('map.json').then(r => r.json());
//   return;
//   for (const crash of crashes) {
//     // return;
//     const marker = new google.maps.Marker({
//       position: {
//         lat: crash.latitude,
//         lng: crash.longitude,
//       },
//       map,
//       title: crash.injuries,
//     });
//     marker.addListener("click", (event) => {
//       // const {pageX, pageY} = event.domEvent;
//       // const div = document.createElement('div');
//       // div.textContent = crash.injuries;
//       // div.style.cssText = `
//       //   position: fixed;
//       //   left: ${pageX}px;
//       //   top: ${pageY}px;
//       //   border: 1px solid red;
//       //   padding: 10px;
//       //   border-radius: 5px;
//       //   background-color: rgba(0, 0, 0, 0.4);
//       //   color: yellow;
//       // `;
//       // document.body.appendChild(div);
//       // return;
//       // console.log(event);

//       const dialog = document.createElement('dialog');
//       const iframe = document.createElement('iframe');
//       iframe.style.cssText = `
//         width: calc(100vw - 100px);
//         height: calc(100vh - 100px);
//       `;
//       iframe.src = crash.path;
//       dialog.appendChild(iframe);
//       // document.body.appendChild(iframe);
//       document.body.appendChild(dialog);
//       dialog.showModal();
//       // const a = document.createElement('a');
//       // a.href = crash.path;
//       // a.target = '_blank';
//       // document.body.appendChild(a);
//       // a.click();
//     });
//   }
// }

let AdvancedMarkerElementConstructor;

async function initialize() {
  const ui = document.createElement('crash-ui');
  document.body.appendChild(ui);


  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  AdvancedMarkerElementConstructor = AdvancedMarkerElement;

  const mapOptions = {
    zoom: 8,
    center: {lat: 37.772323, lng: -122.214897},
    mapTypeId: "terrain",
  };
  map = new Map(document.getElementById("map"), mapOptions);
  const flightPlanCoordinates = [
    {lat: 37.772323, lng: -122.214897},
    {lat: 39.0968, lng: -120.0324},
  ];
  const flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    editable: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: map,
  });

  const crashes = await fetch('map.json').then(r => r.json());

  google.maps.event.addListener(flightPath, "dragend", getPath);
  google.maps.event.addListener(flightPath.getPath(), "insert_at", getPath);
  google.maps.event.addListener(flightPath.getPath(), "remove_at", getPath);
  google.maps.event.addListener(flightPath.getPath(), "set_at", getPath);

  let markers = [];

  getPath();

  function getPath() {
    for (const marker of markers) {
      marker.setMap(null);
    }
    markers = [];

    var path = flightPath.getPath();
    console.log(path);

    const segments = [];
    const len = path.getLength();
    for (let i = 0; i < len - 1; i++) {
      const p1 = path.getAt(i);
      const p2 = path.getAt(i + 1);
      const s1 = [p1.lat(), p1.lng()];
      const s2 = [p2.lat(), p2.lng()]
      const segment = [s1, s2];
      segments.push(segment);
    }

    const closeCrashes = [];

    for (const crash of crashes) {
      const point = [crash.latitude, crash.longitude];
      if (minDistanceToSegments(point, segments) < 10) {
        const marker = addMarket(crash);
        markers.push(marker);
        closeCrashes.push(crash);
      }
    }

    ui.crashes = closeCrashes;

  }


  /**
   * A menu that lets a user delete a selected vertex of a path.
   */
  class DeleteMenu extends google.maps.OverlayView {
    div_;
    divListener_;
    constructor() {
      super();
      this.div_ = document.createElement("div");
      this.div_.className = "delete-menu";
      this.div_.innerHTML = "Delete";

      const menu = this;

      google.maps.event.addDomListener(this.div_, "click", () => {
        menu.removeVertex();
      });
    }
    onAdd() {
      const deleteMenu = this;
      const map = this.getMap();

      this.getPanes().floatPane.appendChild(this.div_);
      // mousedown anywhere on the map except on the menu div will close the
      // menu.
      this.divListener_ = google.maps.event.addDomListener(
        map.getDiv(),
        "mousedown",
        (e) => {
          if (e.target != deleteMenu.div_) {
            deleteMenu.close();
          }
        },
        true,
      );
    }
    onRemove() {
      if (this.divListener_) {
        google.maps.event.removeListener(this.divListener_);
      }

      this.div_.parentNode.removeChild(this.div_);
      // clean up
      this.set("position", null);
      this.set("path", null);
      this.set("vertex", null);
    }
    close() {
      this.setMap(null);
    }
    draw() {
      const position = this.get("position");
      const projection = this.getProjection();

      if (!position || !projection) {
        return;
      }

      const point = projection.fromLatLngToDivPixel(position);

      this.div_.style.top = point.y + "px";
      this.div_.style.left = point.x + "px";
    }
    /**
     * Opens the menu at a vertex of a given path.
     */
    open(map, path, vertex) {
      this.set("position", path.getAt(vertex));
      this.set("path", path);
      this.set("vertex", vertex);
      this.setMap(map);
      this.draw();
    }
    /**
     * Deletes the vertex from the path.
     */
    removeVertex() {
      const path = this.get("path");
      const vertex = this.get("vertex");

      if (!path || vertex == undefined) {
        this.close();
        return;
      }

      path.removeAt(vertex);
      this.close();
    }
  }

  const deleteMenu = new DeleteMenu();

  google.maps.event.addListener(flightPath, "contextmenu", (e) => {
    // Check if click was on a vertex control point
    if (e.vertex == undefined) {
      return;
    }

    deleteMenu.open(map, flightPath.getPath(), e.vertex);
  });
}

initialize();

function haversine(lon1, lat1, lon2, lat2) {
  // Function to calculate the great circle distance between two points
  // on the earth (specified in decimal degrees)
  const toRadians = (degree) => degree * (Math.PI / 180);

  lon1 = toRadians(lon1);
  lat1 = toRadians(lat1);
  lon2 = toRadians(lon2);
  lat2 = toRadians(lat2);

  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;

  const a = Math.sin(dlat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));
  const r = 6371; // Radius of earth in kilometers. Use 3956 for miles
  return c * r;
}

function pointToLineDistance(destPoint, segmentStart, segmentEnd) {

  const points = [];
  const midpoints = 20;
  for (let fraction = 0; fraction < midpoints + 1; fraction++) {
    const point = [
      segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * fraction / midpoints,
      segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * fraction / midpoints
    ];
    points.push(point);
  }

  const distances = points.map(point => haversine(...point, ...destPoint ));
  return Math.min(...distances);

  // // This approximation treats the Earth's surface as flat for the sake of calculation,
  // // which is reasonably accurate for small distances.

  // // Calculate distances from point to each end of the segment and between segment ends
  // const distToStart = haversine(point[0], point[1], segmentStart[0], segmentStart[1]);
  // const distToEnd = haversine(point[0], point[1], segmentEnd[0], segmentEnd[1]);
  // const distStartToEnd = haversine(segmentStart[0], segmentStart[1], segmentEnd[0], segmentEnd[1]);

  // // Using the Law of Cosines to find the angle at the point
  // const cosAngle = (distToStart ** 2 + distStartToEnd ** 2 - distToEnd ** 2) / (2 * distToStart * distStartToEnd);
  // const sinAngle = Math.sqrt(1 - cosAngle ** 2); // sine is sqrt(1-cos^2(theta))

  // // If the angle is obtuse, return the shortest distance to an endpoint
  // if (cosAngle < 0) {
  //     return Math.min(distToStart, distToEnd);
  // }

  // // Distance from the point to the line segment is the opposite side of the angle (sinAngle * distToStart)
  // // which is the height of the triangle from the point to the line formed by the segment
  // return sinAngle * distToStart;
}

function minDistanceToSegments(point, segments) {
  // Find the minimum distance to any of the line segments
  return segments.reduce((minDist, segment) => {
      const dist = pointToLineDistance(point, segment[0], segment[1]);
      return dist < minDist ? dist : minDist;
  }, Infinity);
}

function addMarket(crash) {

  // const icon = document.createElement('span');
  // icon.textContent = 'skull';
  // icon.classList.add('material-symbols-outlined');

  // const marker = new AdvancedMarkerElementConstructor({
  //   map,
  //   position: { lat: 37.42, lng: -122.1 },
  //   content: icon,
  // });

  let icon, color;
  if (crash.injuries.includes('Fatal')) {
    icon = ICON_DEATH;
    color = 'red';
  } else if (crash.injuries.includes('Serious')) {
    icon = ICON_INJURY;
    color = '#ff3333';
  } else {
    icon = ICON_MINOR;
    color = 'orange';
  }


  const marker = new google.maps.Marker({
    position: {
      lat: crash.latitude,
      lng: crash.longitude,
    },
    map,
    icon: {
      path: icon.icon[4],
      fillColor: color,
      fillOpacity: 1,
      anchor: new google.maps.Point(
        icon.icon[0] / 2, // width
        icon.icon[1], // height
      ),
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: 0.05,
    },
    // icon: `<span class="material-symbols-outlined">
    // skull
    // </span>`,
    // label: {
    //   text: "skull",
    //   fontFamily: "Material Symbols Outlined",
    //   color: "0000ff",
    //   fontSize: "18px",
    // },
    title: crash.injuries,
  });




  // {
  //   text: "\ue530",
  //   fontFamily: "Material Icons",
  //   color: "#ffffff",
  //   fontSize: "18px",
  // }

      marker.addListener("click", (event) => {
      // const {pageX, pageY} = event.domEvent;
      // const div = document.createElement('div');
      // div.textContent = crash.injuries;
      // div.style.cssText = `
      //   position: fixed;
      //   left: ${pageX}px;
      //   top: ${pageY}px;
      //   border: 1px solid red;
      //   padding: 10px;
      //   border-radius: 5px;
      //   background-color: rgba(0, 0, 0, 0.4);
      //   color: yellow;
      // `;
      // document.body.appendChild(div);
      // return;
      // console.log(event);

      const dialog = document.createElement('dialog');
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        width: calc(100vw - 100px);
        height: calc(100vh - 100px);
      `;
      iframe.src = crash.path;
      dialog.appendChild(iframe);
      // document.body.appendChild(iframe);
      document.body.appendChild(dialog);
      dialog.showModal();
      dialog.addEventListener('click', (event) => {
        if (event.target !== iframe) {
          dialog.close();
        }
      });
      // const a = document.createElement('a');
      // a.href = crash.path;
      // a.target = '_blank';
      // document.body.appendChild(a);
      // a.click();
    });
    return marker;
}



// // Example usage:
// const point = [37.57557160489193, -122.32909336410219]; // Your point's longitude and latitude
// const segments = [
//   [[37.58434835412486, -122.32879044135913], [37.576024065662686, -122.34091421969308]], // Each segment defined by two points
//   // Add more segments as needed
// ];

// const closestDistance = minDistanceToSegments(point, segments);
// console.log(closestDistance);
