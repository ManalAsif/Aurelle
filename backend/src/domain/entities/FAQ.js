class FAQ {
  constructor(id, question, answer, category = "General") {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.category = category;
  }
}

module.exports = FAQ;
