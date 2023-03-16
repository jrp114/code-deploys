module.exports = {
  async up(db, client) {
    db.collection('games').updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } });
    db.collection('stats').updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } });
  },

  async down(db, client) {
    db.collection('games').updateMany({ isDeleted: { $exists: true } }, { $unset: { isDeleted: '' } });
    db.collection('stats').updateMany({ isDeleted: { $exists: true } }, { $unset: { isDeleted: '' } });
  }
};
