import re
import unicodedata
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator
from .context import CONTEXT_OPTIONS, PRACTICE_LABELS


def normalize(value: str) -> str:
    value = unicodedata.normalize('NFKC', value)
    value = ''.join(c for c in value if not unicodedata.category(c).startswith('C') or c in '\n\t')
    return re.sub(r'\s+', ' ', value).strip()


class Model(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


Short = Annotated[str, StringConstraints(min_length=1, max_length=120)]
Text = Annotated[str, StringConstraints(min_length=1, max_length=800)]
Level = Annotated[int, Field(strict=True, ge=0, le=4)]


class Profile(Model):
    profession: str = Field(min_length=3, max_length=100)
    course: str = Field(default='', max_length=100)
    semester: int | None = Field(default=None, strict=True, ge=1, le=20)
    consent: bool = Field(strict=True)

    @field_validator('profession', 'course', mode='before')
    @classmethod
    def normalized(cls, value):
        return normalize(value) if isinstance(value, str) else value

    @field_validator('consent')
    @classmethod
    def consent_required(cls, value):
        if not value:
            raise ValueError('É necessário consentimento para processar a avaliação.')
        return value


class AnswerOption(Model):
    value: Level
    label: str = Field(min_length=12, max_length=220)

    @field_validator('label', mode='before')
    @classmethod
    def normalized(cls, value):
        return normalize(value) if isinstance(value, str) else value


class Competency(Model):
    id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,40}$')
    name: Short
    description: str = Field(min_length=1, max_length=300)
    question: str = Field(min_length=1, max_length=300)
    expected_level: Level
    options: list[AnswerOption] = Field(min_length=5, max_length=5)

    @model_validator(mode='after')
    def valid_options(self):
        if [option.value for option in self.options] != [0, 1, 2, 3, 4]:
            raise ValueError('Alternativas devem cobrir os níveis 0 a 4 em ordem.')
        labels = [normalize(option.label).casefold() for option in self.options]
        if len(set(labels)) != 5:
            raise ValueError('Alternativas repetidas.')
        return self


class QuestionnaireContent(Model):
    # Ambiguity is a valid response, not a license to invent a profession.
    clarification: str = Field(default='', max_length=300)
    competencies: list[Competency] = Field(max_length=8)

    @model_validator(mode='after')
    def valid_competencies(self):
        if self.clarification:
            if self.competencies:
                raise ValueError('Esclarecimento não pode conter competências.')
        elif not 5 <= len(self.competencies) <= 8:
            raise ValueError('Questionário deve conter entre 5 e 8 competências.')
        ids = [c.id for c in self.competencies]
        names = [normalize(c.name).casefold() for c in self.competencies]
        if len(set(ids)) != len(ids) or len(set(names)) != len(names):
            raise ValueError('Competências duplicadas.')
        return self


class Questionnaire(QuestionnaireContent):
    profession: str = Field(min_length=3, max_length=100)
    source_mode: Literal['gemini']
    notice: Text
    token: str = Field(default='', max_length=24000)


class Answer(Model):
    competency_id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,40}$')
    self_level: Level
    example: str = Field(default='', max_length=40)

    @field_validator('example')
    @classmethod
    def valid_practice_choice(cls, value):
        if value and value not in PRACTICE_LABELS:
            raise ValueError('Escolha uma situação de prática válida.')
        return value


class AssessmentRequest(Model):
    token: str = Field(min_length=1, max_length=24000)
    answers: list[Answer] = Field(min_length=5, max_length=8)
    consent: bool = Field(strict=True)
    context: dict[str, str] = Field(default_factory=dict, max_length=12)

    @field_validator('context')
    @classmethod
    def valid_context(cls, value):
        for question, choice in value.items():
            if question not in CONTEXT_OPTIONS or (choice and choice not in CONTEXT_OPTIONS[question]):
                raise ValueError('Escolha uma alternativa válida para cada pergunta de contexto.')
        return value

    @model_validator(mode='after')
    def valid_request(self):
        if not self.consent:
            raise ValueError('Consentimento obrigatório.')
        ids = [a.competency_id for a in self.answers]
        if len(set(ids)) != len(ids):
            raise ValueError('Respostas duplicadas.')
        return self


class Gap(Model):
    competency_id: str
    name: str
    expected_level: Level
    self_level: Level
    gap: Level


class Week(Model):
    week: int = Field(strict=True, ge=1, le=4)
    title: Short
    objective: Text
    actions: list[Text] = Field(min_length=1, max_length=4)
    deliverable: Text


class Guidance(Model):
    summary: Text
    strengths: list[Text] = Field(max_length=8)
    priorities: list[Text] = Field(max_length=8)
    weeks: list[Week] = Field(min_length=4, max_length=4)
    limitations: list[Text] = Field(min_length=1, max_length=5)

    @model_validator(mode='after')
    def four_weeks(self):
        if [w.week for w in self.weeks] != [1, 2, 3, 4]:
            raise ValueError('A trilha deve conter semanas 1, 2, 3 e 4 nessa ordem.')
        return self


class Assessment(Guidance):
    gaps: list[Gap]
    source_mode: Literal['gemini']
    notice: Text
