// Finite graphical carts represent the point-particle collision law. Their
// facing bumpers, rather than their centres, meet at the computed contact point.
// This mapping never changes x1/x2, impact time, velocities or measured data.
export const COLLISION_DISPLAY_SCALE=.28;
// Equal chassis heights keep facing bumpers and wheels aligned. Changing mass
// changes the load carried by a cart, not the size of its wheels or chassis.
export const COLLISION_CART_SCALE=.9;
// labCart's bumper reaches 0.34 + 0.18/2 from its local centre.
export const collisionCartCenter=(position,side)=>position*COLLISION_DISPLAY_SCALE+side*.43*COLLISION_CART_SCALE;
