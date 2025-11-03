/**
 * User - Represents an individual investor using the system
 * State: userId, name, email, createdAt
 * Actions: None (passive model for identification)
 * 
 * Minimal implementation for basket trading and portfolio ownership.
 * No authentication required for MVP - user identification only.
 */

class User {
  constructor(userId, name, email = null) {
    this.userId = userId; // Unique identifier
    this.name = name; // Display name
    this.email = email; // Optional contact info
    this.createdAt = new Date();
  }

  /**
   * Get user metadata
   * @returns {Object} User metadata
   */
  get_metadata() {
    return {
      userId: this.userId,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;

