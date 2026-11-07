/**
 * Política de Privacidade do PythonQuest — fonte única do texto.
 *
 * A tela do app (src/app/privacy.tsx) e a página pública do GitHub Pages
 * (docs/privacy-policy.html, gerada por `npm run privacy:build`) usam este
 * arquivo. Ao mudar o texto: atualize PRIVACY_POLICY_UPDATED_AT, rode
 * `npm run privacy:build` e publique a pasta docs/.
 *
 * Mantenha este arquivo sem imports (ele também é lido pelo script em Node).
 */

export const PRIVACY_POLICY_URL = 'https://patriky1.github.io/PythonQuest/privacy-policy.html';
export const PRIVACY_CONTACT_EMAIL = 'patrikybrito@gmail.com';
export const PRIVACY_CONTROLLER_NAME = 'Patriky';
export const PRIVACY_POLICY_UPDATED_AT = '7 de novembro de 2026';

export type PrivacyBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };

export type PrivacySection = {
  title: string;
  blocks: PrivacyBlock[];
};

const p = (text: string): PrivacyBlock => ({ type: 'paragraph', text });
const list = (...items: string[]): PrivacyBlock => ({ type: 'list', items });

export const PRIVACY_POLICY_INTRO =
  'Esta Política de Privacidade explica quais dados o aplicativo PythonQuest coleta, como ' +
  'eles são usados, com quem são compartilhados e quais são os seus direitos, de acordo com a ' +
  'Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).';

export const PRIVACY_POLICY_SECTIONS: PrivacySection[] = [
  {
    title: '1. Quem é o responsável pelos seus dados',
    blocks: [
      p(
        `O PythonQuest (pacote com.pythonquest.app) é desenvolvido por ${PRIVACY_CONTROLLER_NAME}, ` +
          'que é o controlador dos dados pessoais tratados pelo aplicativo.'
      ),
      p(`Contato para qualquer assunto de privacidade: ${PRIVACY_CONTACT_EMAIL}.`)
    ]
  },
  {
    title: '2. Dados que coletamos',
    blocks: [
      p(
        'Você pode usar o PythonQuest sem criar uma conta. Nesse caso, nenhum dado de cadastro ou ' +
          'de progresso seu é enviado ao nosso servidor, apenas os dados técnicos de conexão ' +
          'descritos abaixo, necessários para baixar as lições. Se você criar uma conta, coletamos:'
      ),
      list(
        'Dados da conta: nome, e-mail e senha, informados por você no cadastro.',
        'Progresso de aprendizagem: XP, nível, lições e missões concluídas, conquistas e medalhas, ' +
          'para salvar seu avanço e sincronizá-lo entre aparelhos.',
        'Dados técnicos de conexão: ao se comunicar com o nosso servidor, informações como o ' +
          'endereço IP e o horário da requisição podem ser registradas pelo servidor e pelo ' +
          'provedor de hospedagem, para o funcionamento e a segurança do serviço.'
      ),
      p(
        'Não coletamos localização, contatos, fotos, arquivos, câmera, microfone nem identificadores ' +
          'de publicidade. O aplicativo não exibe anúncios e não usa ferramentas de análise ou ' +
          'rastreamento de terceiros.'
      )
    ]
  },
  {
    title: '3. Dados que ficam apenas no seu aparelho',
    blocks: [
      p('Alguns dados são guardados somente no armazenamento local do aplicativo, no seu aparelho:'),
      list(
        'Os códigos que você escreve no Playground e o histórico de execuções. O código Python é ' +
          'executado no próprio aparelho e não é enviado ao nosso servidor.',
        'O progresso de quem usa o app sem conta.',
        'O token de sessão e uma cópia dos dados da sua conta, para manter você conectado, ' +
          'inclusive sem internet.',
        'Preferências de uso, como já ter visto a tela de boas-vindas.'
      ),
      p(
        'Esses dados são apagados quando você desinstala o aplicativo ou limpa os dados dele nas ' +
          'configurações do Android. Ao sair da conta, o token e a cópia dos dados da conta são ' +
          'removidos do aparelho.'
      )
    ]
  },
  {
    title: '4. Como usamos os seus dados',
    blocks: [
      list(
        'Criar e manter a sua conta e permitir o login.',
        'Salvar o seu progresso e sincronizá-lo quando você entra em outro aparelho.',
        'Mostrar o seu XP, nível, conquistas e medalhas.',
        'Manter o serviço funcionando, seguro e protegido contra abusos.'
      ),
      p('Não vendemos os seus dados e não os usamos para publicidade.')
    ]
  },
  {
    title: '5. Bases legais',
    blocks: [
      list(
        'Execução de contrato (art. 7º, V, da LGPD): para criar a sua conta e oferecer as ' +
          'funcionalidades que você solicita, como salvar e sincronizar o progresso.',
        'Legítimo interesse (art. 7º, IX, da LGPD): para registros técnicos necessários à ' +
          'segurança e ao funcionamento do serviço.'
      )
    ]
  },
  {
    title: '6. Compartilhamento com terceiros',
    blocks: [
      p('Seus dados só são compartilhados com fornecedores necessários para o app funcionar:'),
      list(
        'Render (render.com): hospeda o servidor do PythonQuest, que recebe e armazena os dados da ' +
          'conta e do progresso.',
        'jsDelivr (cdn.jsdelivr.net): entrega ao aplicativo os arquivos do interpretador Python ' +
          '(Pyodide) usado no Playground. Esse serviço recebe apenas dados técnicos da conexão, ' +
          'como o endereço IP, e não recebe seus códigos nem os dados da sua conta.'
      ),
      p(
        'Esses fornecedores podem processar dados fora do Brasil. Nesses casos, a transferência ' +
          'internacional ocorre conforme o art. 33 da LGPD. Também podemos compartilhar dados ' +
          'quando houver obrigação legal ou ordem de autoridade competente.'
      )
    ]
  },
  {
    title: '7. Segurança',
    blocks: [
      p(
        'Toda a comunicação entre o aplicativo e o nosso servidor é criptografada (HTTPS). A sua ' +
          'senha não fica salva no aparelho, e o acesso aos dados da conta exige o token de sessão ' +
          'gerado no seu login. Nenhum sistema é totalmente imune a falhas, mas adotamos medidas ' +
          'razoáveis para proteger os seus dados.'
      )
    ]
  },
  {
    title: '8. Por quanto tempo guardamos os dados',
    blocks: [
      p(
        'Os dados da conta e do progresso são mantidos enquanto a sua conta existir. Após um ' +
          'pedido de exclusão, eles são apagados em até 30 dias, exceto quando a lei exigir que ' +
          'algum dado seja mantido por mais tempo.'
      )
    ]
  },
  {
    title: '9. Seus direitos',
    blocks: [
      p('Pela LGPD (art. 18), você pode, a qualquer momento:'),
      list(
        'Confirmar se tratamos os seus dados e acessá-los.',
        'Corrigir dados incompletos, inexatos ou desatualizados.',
        'Pedir a exclusão dos seus dados e da sua conta.',
        'Pedir a portabilidade dos seus dados.',
        'Saber com quem os seus dados são compartilhados.',
        'Revogar o seu consentimento, quando ele for a base do tratamento.'
      ),
      p(
        `Para exercer qualquer direito, envie um e-mail para ${PRIVACY_CONTACT_EMAIL}. Responderemos ` +
          'em até 15 dias. Você também pode apresentar reclamação à Autoridade Nacional de Proteção ' +
          'de Dados (ANPD).'
      )
    ]
  },
  {
    title: '10. Como excluir a sua conta e os seus dados',
    blocks: [
      p(
        `Envie um e-mail para ${PRIVACY_CONTACT_EMAIL}, a partir do endereço cadastrado na sua conta, ` +
          'com o assunto "Excluir conta PythonQuest". A sua conta e todos os dados associados a ela ' +
          '(nome, e-mail, senha e progresso) serão apagados em até 30 dias, e você receberá uma ' +
          'confirmação.'
      ),
      p(
        'Você também pode zerar o seu progresso a qualquer momento na aba Perfil do aplicativo. ' +
          'Para apagar os dados guardados no aparelho, saia da conta e desinstale o aplicativo ou ' +
          'limpe os dados dele nas configurações do Android.'
      )
    ]
  },
  {
    title: '11. Crianças e adolescentes',
    blocks: [
      p(
        'O PythonQuest não é direcionado a crianças menores de 13 anos, e não coletamos ' +
          'intencionalmente dados pessoais delas. Se você é pai, mãe ou responsável e acredita que ' +
          `uma criança nos forneceu dados, entre em contato pelo e-mail ${PRIVACY_CONTACT_EMAIL} ` +
          'para que eles sejam excluídos.'
      )
    ]
  },
  {
    title: '12. Alterações nesta política',
    blocks: [
      p(
        'Podemos atualizar esta política para refletir mudanças no aplicativo ou na legislação. A ' +
          'data da última atualização aparece no início do documento. Mudanças relevantes serão ' +
          'informadas no aplicativo.'
      )
    ]
  },
  {
    title: '13. Contato',
    blocks: [p(`${PRIVACY_CONTROLLER_NAME} — ${PRIVACY_CONTACT_EMAIL}`)]
  }
];
