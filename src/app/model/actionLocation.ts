export class ActionLocation {
	public name: string;
	public coordinates?: [number, number]; //LonLat

	private googleMapsQueryBaseURI: string = 'https://www.google.com/maps/search/?api=1&query=';

	constructor(data?: Partial<ActionLocation>) {
		this.name = data?.name || '';
		this.coordinates = data?.coordinates;
	}

	public getMapURI(): string {
		return this.googleMapsQueryBaseURI + encodeURI(this.coordinates?.slice().reverse().join(',') || this.name);
	}
}