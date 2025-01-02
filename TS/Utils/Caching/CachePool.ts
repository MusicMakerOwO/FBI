export default class CachePool<T> {

	public pools: T[][];
	public currentPool: number;

	constructor(pools: number) {
		if (pools < 2) throw new Error(`CachePool must have at least 2 pools - Received ${pools}`);

		this.pools = new Array(pools).fill(null).map(() => new Array<T>());
		this.currentPool = 0;
	}

	public get pool() {
		return this.pools[this.currentPool];
	}

	add(value: T) {
		this.pools[this.currentPool].push(value);
	}

	switch() {
		// increment and wrap aroung
		this.currentPool = (this.currentPool + 1) % this.pools.length;
	}

	clear(pool: number) {
		if (pool >= this.pools.length) throw new Error(`Pool index out of bounds - Received ${pool}, only ${this.pools.length} pools available`);
		this.pools[pool].length = 0; // Doesn't clear the memory, it will write over it as it fills
	}
}