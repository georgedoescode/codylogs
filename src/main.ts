import "./style.css";
import { SVG } from "@svgdotjs/svg.js";
import { createRandom } from "generative-utils";
import simplify from "simplify-js";
import polygonClipping from "polygon-clipping";
import offsetPolygon from "offset-polygon";

const random = createRandom();

const svg = SVG().viewbox(0, 0, 1024, 1024).addTo("body");

function pointsInPath(pathData: string, numPoints: number = 10) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);

  const pathLength = path.getTotalLength();
  const step = pathLength / numPoints;
  const points = [];

  for (let i = 0; i < pathLength; i += step) {
    points.push(path.getPointAtLength(i));
  }

  return points;
}

function pickRandomItemsInOrder<T>(array: T[], n: number): T[] {
  if (n <= 0 || array.length === 0) {
    return [];
  }

  if (n >= array.length) {
    return [...array]; // Return all elements if n is greater than or equal to array length
  }

  // Create a copy of the array and shuffle it
  const shuffledIndices = array.map((_, index) => index);
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [
      shuffledIndices[j],
      shuffledIndices[i],
    ];
  }

  // Pick the first n indices from the shuffled array
  const selectedIndices = shuffledIndices.slice(0, n).sort((a, b) => a - b);

  // Map the sorted indices to their corresponding items
  return selectedIndices.map((index) => array[index]);
}

function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) {
    return "";
  }

  // Start the path with the first point using the "M" command
  const { x: startX, y: startY } = points[0];
  let path = `M ${startX} ${startY}`;

  // Add each subsequent point using the "L" command for a line
  for (let i = 1; i < points.length; i++) {
    const { x, y } = points[i];
    path += ` L ${x} ${y}`;
  }

  path += "Z";

  return path;
}

function degToRad(deg: number) {
  return deg * (Math.PI / 180);
}

function xyToArray(
  points: Array<{ x: number; y: number }>
): Array<[number, number]> {
  return points.map((p) => [p.x, p.y]);
}

function createLogOutline(
  center: { x: number; y: number },
  startAngle: number,
  angleRange: number,
  radius: number
) {
  const numPoints = 128;

  const angleStep = degToRad(angleRange) / numPoints;

  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const theta = degToRad(startAngle) + i * angleStep;

    const x = center.x + Math.cos(theta) * radius;
    const y = center.y + Math.sin(theta) * radius;

    points.push({ x, y });
  }

  return [center, ...points, center];
}

const logs: Array<Array<{ x: number; y: number }>> = [];

for (let i = 0; i < 10_000; i++) {
  const x = random(0, 1024);
  const y = random(0, 1024);
  const radius = random(128, 512);

  const log = simplify(
    createLogOutline({ x, y }, random(0, 360), random(30, 360), radius),

    radius / 25,
    true
  );

  if (
    !logs.some(
      (l) =>
        polygonClipping.intersection(
          [xyToArray(offsetPolygon(log.slice(0, log.length - 1), 8, 0))],
          [xyToArray(offsetPolygon(l.slice(0, l.length - 1), 8, 0))]
        ).length !== 0
    )
  ) {
    logs.push(log);
  }
}

logs.forEach((l) => {
  const path = pointsToSvgPath(l);

  const points = pointsInPath(path, 50);

  const random = pickRandomItemsInOrder(points, 25);

  svg
    .polygon(random.map((p) => [p.x, p.y]))
    .fill("none")
    .stroke({
      width: 8,
      color: "#000",
      linejoin: "bevel",
    });

  // svg.path(path).fill("none").stroke({
  //   width: 8,
  //   color: "#000",
  // });
  // svg
  //   .polygon(l.map((p) => [p.x, p.y]))
  //   .stroke({
  //     width: 8,
  //     color: "#000",
  //   })
  //   .fill("none");
});
