describe('患者基本情報登録テスト', () => {
  beforeEach(() => {
    cy.visit('/patient_basic');
  });

  it('バリデーションエラーが表示されることを確認', () => {
    cy.get('button').contains('データを登録する').click();
    cy.contains('氏名を入力してください').should('be.visible');
    cy.contains('氏名（カナ）を入力してください').should('be.visible');
  });

  it('不正なメールアドレスでエラーが出ることを確認', () => {
    cy.get('input[name="name"]').type('テスト 太郎');
    cy.get('input[name="nameKana"]').type('テスト タロウ');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button').contains('データを登録する').click();
    cy.contains('有効なメールアドレスを入力してください').should('be.visible');
  });

  it('電話番号が11桁までに制限されていることを確認', () => {
    const longPhone = '090123456789'; // 12桁
    cy.get('input[name="tel"]').type(longPhone);
    cy.get('input[name="tel"]').should('have.value', '090-1234-5678'); // 11桁で止まる(ハイフン自動補完は実装によるが現状はreplaceのみ)
  });
});
