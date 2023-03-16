module.exports = {
  async up(db, client) {
    const penalties = await db.collection('stats').find({ penalty: { $exists: true } }).toArray()
    penalties.forEach(penalty => {
      penalty.duration = (penalty.penalty.duration.minutes * 60) + penalty.penalty.duration.seconds
      db.collection('stats').updateOne(
        { _id: penalty._id },
        { $set: { duration: penalty.duration } }
      )
    })
  },

  async down(db, client) {
    db.collection('stats').updateMany(
      { penalty: { $exists: true } },
      { $unset: { duration: '' } }
    )
  }
};
