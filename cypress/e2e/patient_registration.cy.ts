describe('患者基本情報登録テスト', () => {
  beforeEach(() => {
    cy.visit('/patient_basic');
  });

  it('バリデーションエラーが表示されることを確認', () => {
    cy.get('button').contains('データを登録する').click();
    cy.contains('氏名を入力してください').should('be.visible');
    cy.contains('氏名（カナ）を入力してください').should('be.visible');
  });


});
