const conn = require('../config');

const User = {
  create: (user, callback) => {
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    conn.query(sql, [user.name, user.email, user.password, user.role], callback);
  },

  findByEmail: (email, callback) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    conn.query(sql, [email], (err, results) => {
      if (err) return callback(err);
      return callback(null, results[0]);
    });
  }
};

module.exports = User;
