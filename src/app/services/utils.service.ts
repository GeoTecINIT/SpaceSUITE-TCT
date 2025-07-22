import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class UtilsService {
    
    imagePlaceholder: string = "https://www.esri.com/content/dam/esrisites/en-us/home/homepage-what-is-gis-static-dynamic.jpg";

    knowledgeArea: Map<string, string> = new Map([
        ["AM", "Analytical Methods"],
        ["CF", "Conceptual Foundations"],
        ["CV", "Cartography and Visualization"],
        ["DA", "Design and Setup of Geographic Information Systems"],
        ["DM", "Data Modeling, Storage and Exploitation"],
        ["GC", "Geocomputation"],
        ["GD", "Geospatial Data"],
        ["GN", "GNSS"],
        ["GS", "GI and Society"],
        ["IP", "Image processing and analysis"],
        ["OI", "Organizational and Institutional Aspects"],
        ["PP", "Physical principles"],
        ["PS", "Platforms, sensors and digital imagery"],
        ["SA", "Satellite Systems"],
        ["SC", "Satellite Communication"],
        ["TA", "Thematic and application domains"],
        ["WB", "Web-based GI"]
    ]);

    convertHexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}